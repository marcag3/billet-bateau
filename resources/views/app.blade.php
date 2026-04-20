<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#0f172a">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="{{ config('app.name', 'Billet Bateau App') }}">
        <title>{{ config('app.name', 'Billet Bateau App') }}</title>
        <link rel="manifest" href="/build/app.webmanifest">
        <link rel="icon" href="/icons/app-icon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/icons/app-icon.svg">
        @vite('resources/js/entries/app.main.js')
    </head>
    <body>
        <div id="app-root"></div>
    </body>
</html>
