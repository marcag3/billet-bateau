<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Auth;

class PaymentPolicy
{
    use HandlesAuthorization;

    public function viewAny(Authenticatable $user, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($client !== null && $user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('view payments');
    }

    public function view(Authenticatable $user, Payment $payment, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($client !== null && $user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('view payments');
    }

    public function create(Authenticatable $user, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            return true;
        }

        return $user->can('edit payments');
    }

    public function update(Authenticatable $user, Payment $payment, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            return false;
        }

        return $user->can('edit payments');
    }

    public function delete(Authenticatable $user, Payment $payment, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            return false;
        }

        return $user->can('delete payments');
    }
}
