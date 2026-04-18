<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return $this->view($user);
    }

    public function view(User $user, ?Role $role = null)
    {
        return $user->can('view roles');
    }

    public function create(User $user)
    {
        return $this->update($user);
    }

    public function update(User $user, ?Role $role = null)
    {
        return $user->can('edit roles');
    }

    public function delete(User $user, Role $role)
    {
        return $user->can('delete roles');
    }
}
