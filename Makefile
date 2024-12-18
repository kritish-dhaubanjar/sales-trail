install:
	cd app && npm install
	cd api && composer install

.app:
	cd app && npm run dev

.api:
	cd api && php artisan serve

watch:
	make -j 2 .api .app

build:
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
