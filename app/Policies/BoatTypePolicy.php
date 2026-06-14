<?php

namespace App\Policies;

use App\Models\BoatType;
use App\Models\User;

class BoatTypePolicy
{
    /**
     * V1: no staff roles. Any authenticated back-office user may manage any boat type.
     */
    public function update(User $user, BoatType $boatType): bool
    {
        return true;
    }

    /**
     * V1: no staff roles. Any authenticated back-office user may manage any boat type.
     */
    public function delete(User $user, BoatType $boatType): bool
    {
        return true;
    }
}
