<?php

use App\Http\Controllers\Api\ElectricTokenController;
use App\Http\Controllers\Api\TodoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'throttle:60,1'])->group(function (): void {
    Route::get('/electric/token', ElectricTokenController::class)->name('api.electric.token');
    Route::apiResource('todos', TodoController::class)->only(['index', 'store', 'update', 'destroy']);
});
