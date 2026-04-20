<?php

use App\Http\Controllers\Api\TodoShapeProxyController;
use App\Http\Controllers\Api\TodoController;
use App\Http\Controllers\Auth\SessionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'throttle:60,1'])->group(function (): void {
    Route::get('/auth/me', [SessionController::class, 'me'])->name('api.auth.me');
});

Route::middleware(['web', 'auth:sanctum', 'throttle:60,1'])->group(function (): void {
    Route::get('/shapes/todos', TodoShapeProxyController::class)->name('api.shapes.todos');
    Route::apiResource('todos', TodoController::class)->only(['index', 'store', 'update', 'destroy']);
});
