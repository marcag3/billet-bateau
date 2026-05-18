<?php

use App\Http\Controllers\Auth\InstallController;
use App\Http\Controllers\Auth\ProgramInvitationAcceptController;
use App\Http\Controllers\Auth\SessionController;
use App\Http\Middleware\EnsureApplicationIsInstalled;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', EnsureApplicationIsInstalled::class])->group(function (): void {
    Route::get('/app/invite/{token}', function () {
        return view('app');
    })->where('token', '[A-Za-z0-9]{64}')->name('app.invite');

    Route::middleware('throttle:120,1')->group(function (): void {
        Route::get('/invite/{token}', [ProgramInvitationAcceptController::class, 'show'])
            ->where('token', '[A-Za-z0-9]{64}')
            ->name('invite.show');
        Route::post('/invite/{token}/accept', [ProgramInvitationAcceptController::class, 'accept'])
            ->where('token', '[A-Za-z0-9]{64}')
            ->name('invite.accept');
    });
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

Route::fallback(function () {
    return view('public');
})->name('public.spa');
