<?php

namespace App\Policies;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SubscriptionPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return $this->view($user);
    }

    public function view(User $user, ?Subscription $subscription = null)
    {
        return $user->can('view subscriptions');
    }

    public function create(User $user)
    {
        return $this->update($user);
    }

    public function update(User $user, ?Subscription $subscription = null)
    {
        return $user->can('edit subscriptions');
    }

    public function delete(User $user, Subscription $subscription)
    {
        return $user->can('delete subscriptions');
    }
}
