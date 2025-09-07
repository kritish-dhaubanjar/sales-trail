SSH_USER=kritish3
SSH_HOST=kritishdhaubanjar.com.np
SSH_APP_PATH=/home/kritish3/loopstudiocafe/sales-trail.loopstudiocafe.com
SSH_API_PATH=/home/kritish3/loopstudiocafe/sales-trail.loopstudiocafe.com/api

install:
	cd app && npm install
	cd api && composer install

.app:
	cd app && npm run dev

.api:
	cd api && php artisan serve

watch:
	make -j 2 .api .app

build: install
	sed -i "s|http://127.0.0.1:8000||g" app/next.config.mjs
	cd app && npm run build
	rm api/resources/views/welcome.blade.php
	cp app/dist/index.html api/resources/views/welcome.blade.php

	cd api/public && find ! -name robots.txt ! -name .htaccess ! -name index.php -delete
	cp -r app/dist/* api/public

electron: build
	rm -rf api/vendor
	cd api && composer install --no-dev
	cd api && php artisan migrate:refresh
	cd electron && npm run build

web: build
	scp -r app/dist/* $(SSH_USER)@$(SSH_HOST):$(SSH_APP_PATH)

	cd api && zip -r source.zip . -x ".env" "vendor/*" "database/database.sqlite"
	scp -r api/source.zip $(SSH_USER)@$(SSH_HOST):$(SSH_API_PATH)
	ssh $(SSH_USER)@$(SSH_HOST) 'cd $(SSH_API_PATH) && unzip -o source.zip && rm source.zip && php artisan migrate --force && php artisan config:clear && php artisan cache:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache'
