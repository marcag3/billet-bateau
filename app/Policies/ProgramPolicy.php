<?php

namespace App\Policies;

use App\Models\Program;
use App\Models\User;

class ProgramPolicy
{
    /**
     * V1: no staff roles. Any authenticated back-office user may manage any program.
     */
    public function update(User $user, Program $program): bool
    {
        return true;
    }

    /**
     * V1: no staff roles. Any authenticated back-office user may manage any program.
     */
    public function delete(User $user, Program $program): bool
    {
        return true;
    }
}
