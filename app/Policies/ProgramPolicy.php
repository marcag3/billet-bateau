<?php

namespace App\Policies;

use App\Models\Program;
use App\Models\User;

class ProgramPolicy
{
    public function update(User $user, Program $program): bool
    {
        return $program->userCanManage((int) $user->getAuthIdentifier());
    }

    public function delete(User $user, Program $program): bool
    {
        return $program->userCanManage((int) $user->getAuthIdentifier());
    }
}
