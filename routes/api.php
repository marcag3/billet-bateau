<?php

use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\PowerSyncCredentialsController;
use App\Http\Controllers\Api\PowerSyncUploadController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\PublicProgramController;
use App\Http\Controllers\Auth\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('public')->middleware('throttle:120,1')->group(function (): void {
    Route::get('programs', [PublicProgramController::class, 'index'])->name('api.public.programs.index');
    Route::get('programs/{program:slug}', [PublicProgramController::class, 'show'])
        ->where('program', '[^/]+')
        ->name('api.public.programs.show');
});

Route::middleware(['web', 'throttle:60,1'])->group(function (): void {
    Route::get('/auth/me', [SessionController::class, 'me'])->name('api.auth.me');
});

Route::middleware(['web', 'auth:sanctum', 'throttle:60,1'])->group(function (): void {
    Route::get('/powersync/credentials', PowerSyncCredentialsController::class)->name('api.powersync.credentials');
    Route::post('/powersync/upload', PowerSyncUploadController::class)->name('api.powersync.upload');
    Route::post('/programs', [ProgramController::class, 'store'])->name('api.programs.store');
    Route::get('/media/{type}/{id}', [MediaController::class, 'index'])
        ->whereIn('type', ['program', 'boat_type'])
        ->whereUlid('id')
        ->name('api.media.index');
    Route::post('/media/{type}/{id}', [MediaController::class, 'store'])
        ->whereIn('type', ['program', 'boat_type'])
        ->whereUlid('id')
        ->name('api.media.store');
});
