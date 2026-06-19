<?php

namespace App\Http\Controllers\Api;

use App\Data\Programs\ProgramMembershipData;
use App\Data\Programs\ProgramTransferOwnershipData;
use App\Enums\ProgramRole;
use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\ProgramInvitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProgramMembershipController extends Controller
{
    public function index(Request $request, string $programId): JsonResponse
    {
        $program = Program::query()->findOrFail($programId);

        $this->authorize('manageMembers', $program);

        return response()->json([
            'data' => ProgramMembershipData::fromProgram($program),
        ]);
    }

    public function destroyMember(Request $request, string $programId, string $userId): JsonResponse
    {
        $program = Program::query()->findOrFail($programId);

        $this->authorize('removeMember', [$program, $userId]);

        $program->users()->detach($userId);

        return response()->json(null, 204);
    }

    public function destroyInvitation(Request $request, string $programId, string $invitationId): JsonResponse
    {
        $program = Program::query()->findOrFail($programId);

        $this->authorize('revokeInvitation', $program);

        $invitation = ProgramInvitation::query()
            ->where('program_id', $program->id)
            ->whereKey($invitationId)
            ->firstOrFail();

        if (! $invitation->isPending()) {
            throw ValidationException::withMessages([
                'invitation' => [__('This invitation cannot be revoked.')],
            ]);
        }

        $invitation->update(['revoked_at' => now()]);

        return response()->json(null, 204);
    }

    public function transferOwnership(
        ProgramTransferOwnershipData $data,
        Request $request,
        string $programId,
    ): JsonResponse {
        $program = Program::query()->findOrFail($programId);

        $this->authorize('transferOwnership', [$program, $data->user_id]);

        DB::transaction(function () use ($program, $data, $request): void {
            $ownerId = (string) $request->user()->getAuthIdentifier();

            $program->users()->updateExistingPivot($data->user_id, [
                'role' => ProgramRole::Owner->value,
            ]);

            $program->users()->updateExistingPivot($ownerId, [
                'role' => ProgramRole::Admin->value,
            ]);
        });

        return response()->json(null, 204);
    }
}
