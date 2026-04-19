<?php

use App\Http\Controllers\Auth\SessionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('public');
});

Route::middleware('guest')->group(function (): void {
    Route::get('/app/login', function () {
        return view('app');
    })->name('app.login');

    Route::post('/login', [SessionController::class, 'store'])->name('login');
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [SessionController::class, 'destroy'])->name('logout');
    Route::get('/app/{any?}', function () {
        return view('app');
    })->where('any', '.*');
});
