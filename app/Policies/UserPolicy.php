<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return $this->view($user);
    }

    public function view(User $loggedUser, ?User $user = null)
    {
        if ($user !== null) {
            return $loggedUser->can('view users') || $loggedUser->is($user);
        }

        return $loggedUser->can('view users');
    }

    public function create(User $user)
    {
        return $this->update($user);
    }

    public function update(User $user)
    {
        return $user->can('edit users');
    }

    public function delete(User $user)
    {
        return $user->can('delete users');
    }
}
