<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('public');
});

Route::get('/app/{any?}', function () {
    return view('app');
})->where('any', '.*');
