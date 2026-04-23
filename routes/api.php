<?php

use App\Http\Controllers\Api\PowerSyncCredentialsController;
use App\Http\Controllers\Api\PowerSyncUploadController;
use App\Http\Controllers\Api\TodoController;
use App\Http\Controllers\Auth\SessionController;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'throttle:60,1'])->group(function (): void {
    Route::get('/auth/me', [SessionController::class, 'me'])->name('api.auth.me');

    if (app()->environment('local') && config('app.debug')) {
        Route::post('/_cursor-debug/ingest-d855ad', function (Request $request): \Illuminate\Http\Response {
            $payload = $request->all();
            $path = base_path('.cursor/debug-d855ad.log');
            File::append($path, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");

            return response()->noContent();
        })
            ->withoutMiddleware([ValidateCsrfToken::class])
            ->name('api._cursor_debug.ingest_d855ad');
    }
});

Route::middleware(['web', 'auth:sanctum', 'throttle:60,1'])->group(function (): void {
    Route::get('/powersync/credentials', PowerSyncCredentialsController::class)->name('api.powersync.credentials');
    Route::post('/powersync/upload', PowerSyncUploadController::class)->name('api.powersync.upload');
    Route::apiResource('todos', TodoController::class)->only(['index', 'store', 'update', 'destroy']);
});
