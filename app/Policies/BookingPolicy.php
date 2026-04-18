<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\Client;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Auth;

class BookingPolicy
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

        return $user->can('view bookings');
    }

    public function view(Authenticatable $user, Booking $booking, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($client !== null && $user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('view bookings');
    }

    public function create(Authenticatable $user)
    {
        if (get_class($user) === Client::class) {
            return true;
        }

        return $user->can('edit bookings');
    }

    public function update(Authenticatable $user, Booking $booking, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($client !== null && $user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('edit bookings');
    }

    public function delete(Authenticatable $user, Booking $booking, ?Client $client = null)
    {
        if (get_class($user) === Client::class) {
            if ($client !== null && $user->is($client)) {
                return true;
            }

            return false;
        }

        return $user->can('delete bookings');
    }
}
