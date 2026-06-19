<?php

use App\Http\Controllers\Api\PowerSyncCredentialsController;
use App\Http\Controllers\Api\PowerSyncUploadController;
use App\Http\Controllers\Api\PresignUploadController;
use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\ProgramInvitationController;
use App\Http\Controllers\Api\ProgramMembershipController;
use App\Http\Controllers\Api\PublicBookingCancelController;
use App\Http\Controllers\Api\PublicBookingController;
use App\Http\Controllers\Api\PublicProgramController;
use App\Http\Controllers\Auth\ProfileController;
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
    Route::get('bookings/cancel/{token}', [PublicBookingCancelController::class, 'show'])
        ->where('token', '[A-Za-z0-9]{64}')
        ->name('api.public.bookings.cancel.show');
    Route::post('bookings/cancel/{token}', [PublicBookingCancelController::class, 'cancel'])
        ->where('token', '[A-Za-z0-9]{64}')
        ->name('api.public.bookings.cancel.destroy');
});

Route::middleware(['web', 'throttle:60,1'])->group(function (): void {
    Route::get('/auth/me', [SessionController::class, 'me'])->name('api.auth.me');
});

Route::middleware(['web', 'auth:sanctum', 'throttle:60,1'])->group(function (): void {
    Route::put('/auth/profile', [ProfileController::class, 'update'])->name('api.auth.profile.update');
    Route::put('/auth/password', [ProfileController::class, 'updatePassword'])->name('api.auth.password.update');
    Route::get('/powersync/credentials', PowerSyncCredentialsController::class)->name('api.powersync.credentials');
    Route::post('/powersync/upload', PowerSyncUploadController::class)->name('api.powersync.upload');
    Route::post('/programs', [ProgramController::class, 'store'])->name('api.programs.store');
    Route::post('/programs/{programId}/invitations', [ProgramInvitationController::class, 'store'])
        ->whereUlid('programId')
        ->name('api.programs.invitations.store');
    Route::get('/programs/{programId}/membership', [ProgramMembershipController::class, 'index'])
        ->whereUlid('programId')
        ->name('api.programs.membership.index');
    Route::delete('/programs/{programId}/members/{userId}', [ProgramMembershipController::class, 'destroyMember'])
        ->whereUlid('programId')
        ->whereUlid('userId')
        ->name('api.programs.members.destroy');
    Route::delete('/programs/{programId}/invitations/{invitationId}', [ProgramMembershipController::class, 'destroyInvitation'])
        ->whereUlid('programId')
        ->whereUlid('invitationId')
        ->name('api.programs.invitations.destroy');
    Route::post('/programs/{programId}/transfer-ownership', [ProgramMembershipController::class, 'transferOwnership'])
        ->whereUlid('programId')
        ->name('api.programs.transfer-ownership');

    Route::post('/presign-upload', [PresignUploadController::class, 'presignUpload'])
        ->name('api.presign-upload');
});
