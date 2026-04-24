<?php

use App\Http\Controllers\Api\PowerSyncCredentialsController;
use App\Http\Controllers\Api\PowerSyncUploadController;
use App\Http\Controllers\Api\TodoController;
use App\Http\Controllers\Auth\SessionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'throttle:60,1'])->group(function (): void {
    Route::get('/auth/me', [SessionController::class, 'me'])->name('api.auth.me');
});

Route::middleware(['web', 'auth:sanctum', 'throttle:60,1'])->group(function (): void {
    Route::get('/powersync/credentials', PowerSyncCredentialsController::class)->name('api.powersync.credentials');
    Route::post('/powersync/upload', PowerSyncUploadController::class)->name('api.powersync.upload');
    Route::apiResource('todos', TodoController::class)->only(['index', 'store', 'update', 'destroy']);
});
