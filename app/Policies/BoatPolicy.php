<?php

namespace App\Policies;

use App\Models\Boat;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BoatPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return $this->view($user);
    }

    public function view(User $user, ?Boat $boat = null)
    {
        return $user->can('view boats');
    }

    public function create(User $user)
    {
        return $this->update($user);
    }

    public function update(User $user, ?Boat $boat = null)
    {
        return $user->can('edit boats');
    }

    public function delete(User $user, Boat $boat)
    {
        return $user->can('delete boats');
    }
}
