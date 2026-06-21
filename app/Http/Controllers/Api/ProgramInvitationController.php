<?php

namespace App\Http\Controllers\Api;

use App\Enums\ProgramRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProgramInvitationRequest;
use App\Models\Program;
use App\Models\ProgramInvitation;
use App\Models\User;
use App\Notifications\ProgramInvitationNotification;
use App\Support\AppLocale;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProgramInvitationController extends Controller
{
    public function store(StoreProgramInvitationRequest $request, string $programId): JsonResponse
    {
        $program = Program::query()->findOrFail($programId);

        $this->authorize('addAdmin', $program);

        $email = Str::lower(trim($request->validated('email')));

        $existingUser = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();
        if ($existingUser !== null && $program->userCanManage((string) $existingUser->getAuthIdentifier())) {
            throw ValidationException::withMessages([
                'email' => [__('This user is already a member of the program.')],
            ]);
        }

        ProgramInvitation::query()
            ->where('program_id', $program->id)
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->update(['revoked_at' => now()]);

        $plainToken = Str::random(64);
        $tokenHash = hash('sha256', $plainToken);

        $invitation = DB::transaction(function () use ($request, $program, $email, $tokenHash): ProgramInvitation {
            /** @var ProgramInvitation $created */
            $created = $program->invitations()->create([
                'invited_by_user_id' => (string) $request->user()->getAuthIdentifier(),
                'email' => $email,
                'role' => ProgramRole::Admin->value,
                'token_hash' => $tokenHash,
                'expires_at' => now()->addDays(7),
            ]);

            return $created->load('program');
        });

        $mailLocale = AppLocale::normalize($request->validated('locale'));

        Notification::route('mail', $email)->notify(
            new ProgramInvitationNotification($invitation, $plainToken, mailLocale: $mailLocale),
        );

        return response()->json([
            'data' => [
                'id' => $invitation->id,
                'email' => $invitation->email,
                'expires_at' => $invitation->expires_at->toIso8601String(),
            ],
        ], 201);
    }
}
