# Sales Trail

![sales-trail](https://github.com/user-attachments/assets/8ab48385-d237-4655-8425-7d68f3eecbb2)

## Database
`./api/vendor/nativephp/laravel/src/NativeServiceProvider.php`

```php
    public function rewriteDatabase()
    {
        ...
        $database = base_path().'/database/database.sqlite';

        config(['database.connections.nativephp' => [
            ...
            'url' => env('DATABASE_URL'),
            'database' => $database,
            ...
        ]]);
    }
```
