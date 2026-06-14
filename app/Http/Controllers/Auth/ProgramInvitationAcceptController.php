<?php

namespace App\Http\Controllers\Auth;

use App\Enums\ProgramRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\AcceptProgramInvitationRequest;
use App\Models\Program;
use App\Models\ProgramInvitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ProgramInvitationAcceptController extends Controller
{
    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public function show(string $token): JsonResponse
    {
        $hash = self::hashToken($token);
        $invitation = ProgramInvitation::query()->where('token_hash', $hash)->with('program')->first();

        if ($invitation === null) {
            return response()->json([
                'valid' => false,
                'reason' => 'invalid',
            ]);
        }

        if ($invitation->accepted_at !== null) {
            return response()->json([
                'valid' => false,
                'reason' => 'accepted',
            ]);
        }

        if ($invitation->revoked_at !== null) {
            return response()->json([
                'valid' => false,
                'reason' => 'revoked',
            ]);
        }

        if ($invitation->expires_at->isPast()) {
            return response()->json([
                'valid' => false,
                'reason' => 'expired',
            ]);
        }

        return response()->json([
            'valid' => true,
            'data' => [
                'program_name' => $invitation->program?->name,
                'email' => $invitation->email,
                'expires_at' => $invitation->expires_at->toIso8601String(),
            ],
        ]);
    }

    public function accept(AcceptProgramInvitationRequest $request, string $token): JsonResponse
    {
        $hash = self::hashToken($token);
        $invitation = ProgramInvitation::query()->where('token_hash', $hash)->with('program')->first();

        if ($invitation === null) {
            throw ValidationException::withMessages([
                'token' => [__('This invitation link is invalid.')],
            ]);
        }

        if ($invitation->accepted_at !== null) {
            throw ValidationException::withMessages([
                'token' => [__('This invitation has already been accepted.')],
            ]);
        }

        if ($invitation->revoked_at !== null) {
            throw ValidationException::withMessages([
                'token' => [__('This invitation is no longer valid.')],
            ]);
        }

        if ($invitation->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'token' => [__('This invitation has expired.')],
            ]);
        }

        $program = $invitation->program;
        if ($program === null) {
            throw ValidationException::withMessages([
                'token' => [__('This invitation link is invalid.')],
            ]);
        }

        return DB::transaction(function () use ($request, $invitation, $program): JsonResponse {
            $inviteEmail = Str::lower($invitation->email);

            if (Auth::check()) {
                $user = Auth::user();
                assert($user instanceof User);
                if (Str::lower((string) $user->email) !== $inviteEmail) {
                    throw ValidationException::withMessages([
                        'email' => [__('You must be signed in as :email to accept this invitation.', ['email' => $invitation->email])],
                    ]);
                }
            } else {
                $validated = $request->validated();
                if (User::query()->whereRaw('LOWER(email) = ?', [$inviteEmail])->exists()) {
                    throw ValidationException::withMessages([
                        'email' => [__('An account already exists for this email. Sign in, then open the invitation link again.')],
                    ]);
                }

                $user = User::query()->create([
                    'name' => $validated['name'],
                    'email' => $invitation->email,
                    'password' => $validated['password'],
                ]);

                Auth::guard('web')->login($user);
                $request->session()->regenerate();
            }

            $this->attachInvitedAdmin($program, $user, $invitation->intendedRole());

            $invitation->forceFill(['accepted_at' => now()])->save();

            return response()->json([
                'message' => __('Welcome! You have joined the program.'),
                'user' => [
                    'id' => $user->getAuthIdentifier(),
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'redirect_url' => url('/app/programs'),
            ]);
        });
    }

    private function attachInvitedAdmin(Program $program, User $user, ProgramRole $role): void
    {
        $userId = (string) $user->getAuthIdentifier();

        if (! $program->userCanManage($userId)) {
            $program->users()->attach($userId, ['role' => $role->value]);

            return;
        }

        $current = $program->userRole($userId);
        if ($current === ProgramRole::Owner) {
            return;
        }

        $program->users()->updateExistingPivot($userId, ['role' => $role->value]);
    }
}
