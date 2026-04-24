<?php

namespace App\Policies;

use App\Models\Program;
use App\Models\User;

class ProgramPolicy
{
    public function update(User $user, Program $program): bool
    {
        return (int) $user->getAuthIdentifier() === (int) $program->user_id;
    }

    public function delete(User $user, Program $program): bool
    {
        return (int) $user->getAuthIdentifier() === (int) $program->user_id;
    }
}
