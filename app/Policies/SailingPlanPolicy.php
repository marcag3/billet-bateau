<?php

namespace App\Policies;

use App\Models\SailingPlan;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SailingPlanPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return $this->view($user);
    }

    public function view(User $user, ?SailingPlan $sailingPlan = null)
    {
        return $user->can('view sailing plans');
    }

    public function create(User $user)
    {
        return $this->update($user);
    }

    public function update(User $user, ?SailingPlan $sailingPlan = null)
    {
        return $user->can('edit sailing plans');
    }

    public function delete(User $user, SailingPlan $sailingPlan)
    {
        return $user->can('delete sailing plans');
    }
}
