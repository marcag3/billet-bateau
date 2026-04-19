<?php

use App\Http\Controllers\Auth\InstallController;
use App\Http\Controllers\Auth\SessionController;
use App\Http\Middleware\EnsureApplicationIsInstalled;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('public');
});

Route::middleware('guest')->group(function (): void {
    Route::get('/app/setup', function () {
        return view('app');
    })->name('app.setup');

    Route::get('/setup/status', [InstallController::class, 'status'])->name('setup.status');
    Route::post('/setup', [InstallController::class, 'store'])->name('setup.store');

    Route::middleware(EnsureApplicationIsInstalled::class)->group(function (): void {
        Route::get('/app/login', function () {
            return view('app');
        })->name('app.login');

        Route::post('/login', [SessionController::class, 'store'])->name('login');
    });
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [SessionController::class, 'destroy'])->name('logout');
    Route::get('/app/{any?}', function () {
        return view('app');
    })->where('any', '.*');
});
