<?php

namespace App\Policies;

use App\Enums\ProgramRole;
use App\Models\Program;
use App\Models\User;

class ProgramPolicy
{
    public function view(User $user, Program $program): bool
    {
        return $program->userCanManage((string) $user->getAuthIdentifier());
    }

    public function update(User $user, Program $program): bool
    {
        return $program->userCanManage((string) $user->getAuthIdentifier());
    }

    public function delete(User $user, Program $program): bool
    {
        return $program->userCanManage((string) $user->getAuthIdentifier());
    }

    public function manageMembers(User $user, Program $program): bool
    {
        return $program->userIsOwner((string) $user->getAuthIdentifier());
    }

    public function addAdmin(User $user, Program $program): bool
    {
        return $program->userIsOwner((string) $user->getAuthIdentifier());
    }

    public function removeMember(User $user, Program $program, string $targetUserId): bool
    {
        if (! $program->userIsOwner((string) $user->getAuthIdentifier())) {
            return false;
        }

        if ($targetUserId === (string) $user->getAuthIdentifier()) {
            return false;
        }

        return $program->userRole($targetUserId) === ProgramRole::Admin;
    }

    public function revokeInvitation(User $user, Program $program): bool
    {
        return $program->userIsOwner((string) $user->getAuthIdentifier());
    }

    public function transferOwnership(User $user, Program $program, string $targetUserId): bool
    {
        if (! $program->userIsOwner((string) $user->getAuthIdentifier())) {
            return false;
        }

        if ($targetUserId === (string) $user->getAuthIdentifier()) {
            return false;
        }

        return $program->userRole($targetUserId) === ProgramRole::Admin;
    }
}
