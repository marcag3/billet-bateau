<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\Coupon;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as Authenticatable;

class CouponPolicy
{
    use HandlesAuthorization;

    public function viewAny(Authenticatable $user, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('view invoices');
    }

    public function view(Authenticatable $user, Coupon $coupon, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('view invoices');
    }

    public function create(Authenticatable $user)
    {
        if (get_class($user) === Client::class) {
            return false;
        }

        return $user->can('edit invoices');
    }

    public function update(Authenticatable $user)
    {
        if (get_class($user) === Client::class) {
            return false;
        }

        return $user->can('edit invoices');
    }

    public function delete(Authenticatable $user)
    {
        if (get_class($user) === Client::class) {
            return false;
        }

        return $user->can('delete invoices');
    }
}
