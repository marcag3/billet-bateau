<?php

namespace App\Policies;

use App\Models\Program;
use App\Models\User;

class BookingPolicy
{
    public function createPublic(?User $user, Program $program): bool
    {
        return $program->is_active
            && $program->end_date->greaterThanOrEqualTo(now()->startOfDay());
    }
}
