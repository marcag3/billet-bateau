<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Billet Bateau App') }}</title>
        @vite('resources/frontend/app/main.js')
    </head>
    <body>
        <div id="app-root"></div>
    </body>
</html>
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Laravel') }} - App</title>
        @vite('resources/frontend/app/main.js')
    </head>
    <body>
        <div id="app-root"></div>
    </body>
</html>
