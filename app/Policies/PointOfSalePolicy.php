<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PointOfSalePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return $this->view($user);
    }

    public function view(User $user)
    {
        return $user->can('view points of sale');
    }

    public function create(User $user)
    {
        return $this->update($user);
    }

    public function update(User $user)
    {
        return $user->can('edit points of sale');
    }

    public function delete(User $user)
    {
        return $user->can('delete points of sale');
    }
}
