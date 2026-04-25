<?php

use App\Http\Controllers\Api\PowerSyncCredentialsController;
use App\Http\Controllers\Api\PowerSyncUploadController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\PublicProgramController;
use App\Http\Controllers\Api\TodoController;
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
    Route::apiResource('todos', TodoController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('/programs', [ProgramController::class, 'store'])->name('api.programs.store');
    Route::post('/programs/{program}/media', [ProgramController::class, 'storeMedia'])->name('api.programs.media.store');
});
