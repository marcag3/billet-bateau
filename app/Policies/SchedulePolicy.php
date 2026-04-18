<?php

namespace App\Policies;

use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User;

//this policy will be used on all class related to scheduling trips

class SchedulePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return $this->view($user);
    }

    public function view()
    {
        return true;
        // return $user->can('view schedules');
    }

    public function create(User $user)
    {
        return $this->update($user);
    }

    public function update(User $user)
    {
        return $user->can('edit schedules');
    }

    public function delete(User $user)
    {
        return $user->can('delete schedules');
    }
}
