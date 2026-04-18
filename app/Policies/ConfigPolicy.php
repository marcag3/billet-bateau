<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Spatie\Permission\Models\Config;

class ConfigPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return $user->can('view configs');
    }

    public function view(User $user, ?Config $config = null)
    {
        return $user->can('view configs');
    }

    public function create(User $user)
    {
        return $user->can('edit configs');
    }

    public function update(User $user, ?Config $config = null)
    {
        return $user->can('edit configs');
    }

    public function delete(User $user, Config $config)
    {
        return $user->can('delete configs');
    }
}
