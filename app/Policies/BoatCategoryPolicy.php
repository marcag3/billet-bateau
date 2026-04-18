<?php

namespace App\Policies;

use App\Models\BoatCategory;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BoatCategoryPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return $this->view($user);
    }

    public function view(User $user, ?BoatCategory $boatCategory = null)
    {
        return $user->can('view boat categories');
    }

    public function create(User $user)
    {
        return $this->update($user);
    }

    public function update(User $user, ?BoatCategory $boatCategory = null)
    {
        return $user->can('edit boat categories');
    }

    public function delete(User $user, BoatCategory $boatCategory)
    {
        return $user->can('delete boat categories');
    }
}
