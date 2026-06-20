<?php

namespace App\Data\Programs;

use App\Models\Program;
use App\Models\ProgramInvitation;
use App\Models\User;
use Illuminate\Support\Collection;
use Spatie\LaravelData\Data;

final class ProgramMembershipData extends Data
{
    /**
     * @param  list<ProgramMemberData>  $members
     * @param  list<ProgramPendingInvitationData>  $pending_invitations
     */
    public function __construct(
        public array $members,
        public array $pending_invitations,
    ) {}

    public static function fromProgram(Program $program): self
    {
        /** @var Collection<int, User> $users */
        $users = $program->users()->orderBy('name')->get();

        $members = $users
            ->map(static fn (User $user): ProgramMemberData => ProgramMemberData::fromUser($user))
            ->values()
            ->all();

        $pendingInvitations = $program->invitations()
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->orderBy('created_at')
            ->get()
            ->map(static fn (ProgramInvitation $invitation): ProgramPendingInvitationData => ProgramPendingInvitationData::fromModel($invitation))
            ->values()
            ->all();

        return new self(
            members: $members,
            pending_invitations: $pendingInvitations,
        );
    }
}
