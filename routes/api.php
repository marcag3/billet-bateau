<?php

use App\Http\Controllers\Api\PowerSyncCredentialsController;
use App\Http\Controllers\Api\PowerSyncUploadController;
use App\Http\Controllers\Api\PresignUploadController;
use App\Http\Controllers\Api\ProgramInvitationController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\PublicBookingController;
use App\Http\Controllers\Api\PublicProgramController;
use App\Http\Controllers\Auth\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('public')->middleware('throttle:120,1')->group(function (): void {
    Route::get('programs', [PublicProgramController::class, 'index'])->name('api.public.programs.index');
    Route::get('programs/{program:slug}', [PublicProgramController::class, 'show'])
        ->where('program', '[^/]+')
        ->name('api.public.programs.show');
    Route::get('programs/{program:slug}/booking-options', [PublicBookingController::class, 'bookingOptions'])
        ->where('program', '[^/]+')
        ->name('api.public.programs.booking-options');
    Route::post('programs/{program:slug}/bookings', [PublicBookingController::class, 'store'])
        ->where('program', '[^/]+')
        ->name('api.public.programs.bookings.store');
});

Route::middleware(['web', 'throttle:60,1'])->group(function (): void {
    Route::get('/auth/me', [SessionController::class, 'me'])->name('api.auth.me');
});

Route::middleware(['web', 'auth:sanctum', 'throttle:60,1'])->group(function (): void {
    Route::get('/powersync/credentials', PowerSyncCredentialsController::class)->name('api.powersync.credentials');
    Route::post('/powersync/upload', PowerSyncUploadController::class)->name('api.powersync.upload');
    Route::post('/programs', [ProgramController::class, 'store'])->name('api.programs.store');
    Route::get('/programs/{programId}/invitation-eligibility', [ProgramInvitationController::class, 'eligibility'])
        ->whereUlid('programId')
        ->name('api.programs.invitations.eligibility');
    Route::post('/programs/{programId}/invitations', [ProgramInvitationController::class, 'store'])
        ->whereUlid('programId')
        ->name('api.programs.invitations.store');

    Route::post('/presign-upload', [PresignUploadController::class, 'presignUpload'])
        ->name('api.presign-upload');
});
