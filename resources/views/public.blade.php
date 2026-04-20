<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Billet Bateau') }}</title>
        @vite('resources/js/entries/public.main.js')
    </head>
    <body>
        <div id="public-root"></div>
    </body>
</html>
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Laravel') }} - Public</title>
        @vite('resources/js/entries/public.main.js')
    </head>
    <body>
        <div id="public-root"></div>
    </body>
</html>
