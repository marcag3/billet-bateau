<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as Authenticatable;

class ClientPolicy
{
    use HandlesAuthorization;

    public function viewAny(Authenticatable $user)
    {
        if (get_class($user) === Client::class) {
            return false;
        }

        return $user->can('view clients');
    }

    public function view(Authenticatable $user, Client $client)
    {
        if (get_class($user) === Client::class) {
            if ($user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('view clients');
    }

    public function create(Authenticatable $user)
    {
        if (get_class($user) === Client::class) {
            return false;
        }

        return $user->can('edit clients');
    }

    public function update(Authenticatable $user, Client $client)
    {
        if (get_class($user) === Client::class) {
            if ($user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('edit clients');
    }

    public function delete(Authenticatable $user, Client $client)
    {
        if (get_class($user) === Client::class) {
            if ($user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('delete clients');
    }
}
