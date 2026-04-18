<?php

namespace App\Policies;

use App\Models\Promotion;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PromotionPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return $this->view($user);
    }

    public function view(User $user, ?Promotion $promotion = null)
    {
        return $user->can('view promotions');
    }

    public function create(User $user)
    {
        return $this->update($user);
    }

    public function update(User $user, ?Promotion $promotion = null)
    {
        return $user->can('edit promotions');
    }

    public function delete(User $user, Promotion $promotion)
    {
        return $user->can('delete promotions');
    }
}
