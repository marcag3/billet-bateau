<?php

namespace App\Observers;

use App\Models\Booking;
use App\Events\BookingSaving;
use App\Notifications\BookingConfirmed;

class BookingObserver
{
    public function saved(Booking $booking)
    {
        if ($booking->confirmed_at === null) {
            BookingSaving::dispatch($booking->client);
        } else {
            $booking->client->notify(new BookingConfirmed($booking));
        }
    }

    public function deleted(Booking $booking)
    {
        BookingSaving::dispatch($booking->client);
    }
}
