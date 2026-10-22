# FreelanceFlow Preview (Laravel)

This is the Laravel version of the FreelanceFlow website preview. Laravel provides the routes, API, authentication, migrations, and SQLite-backed local demo. The original React interface is mounted from a Blade view and built with Vite.

## Main project areas

- `app/` — Laravel controllers and models
- `routes/web.php` — page and API routes
- `database/migrations/` — Laravel schema
- `resources/views/app.blade.php` — Laravel Blade page
- `resources/js/freelanceflow/src/` — React preview interface
- `resources/css/app.css` — interface styles and design tokens
- `vite.config.js` — Laravel, React, and Tailwind build configuration

## Requirements

- PHP 8.2+ with PDO SQLite enabled
- Composer
- Node.js and npm

## Run locally

```sh
composer install
copy .env.example .env
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
php artisan key:generate
php artisan migrate
npm install
npm run build
php artisan serve
```

On macOS or Linux, use `cp .env.example .env` instead of `copy .env.example .env`. Open `http://127.0.0.1:8000` and register an account to view the dashboard.

The local `.env` file, SQLite database, installed dependencies, and compiled Vite output are excluded from the project copy. Do not commit `.env` or production secrets.