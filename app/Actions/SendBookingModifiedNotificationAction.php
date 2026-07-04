<?php

namespace App\Actions;

use App\Models\Booking;
use App\Notifications\BookingModifiedNotification;
use App\Support\AppLocale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Lorisleiva\Actions\Concerns\AsAction;

final class SendBookingModifiedNotificationAction
{
    use AsAction;

    /** @var array<string, true> */
    private static array $sentBookingIds = [];

    public function handle(Booking $booking): void
    {
        $bookingId = (string) $booking->getKey();

        if (isset(self::$sentBookingIds[$bookingId])) {
            return;
        }

        if ($booking->trashed()) {
            return;
        }

        $contactEmail = $booking->contact_email;
        if ($contactEmail === null || trim($contactEmail) === '') {
            return;
        }

        self::$sentBookingIds[$bookingId] = true;

        $locale = AppLocale::normalize($booking->contact_locale);

        DB::afterCommit(function () use ($bookingId, $contactEmail, $locale): void {
            $booking = Booking::query()
                ->whereKey($bookingId)
                ->with([
                    'program:id,name,email_signature,timezone',
                    'trip:id,scheduled_departure_at,product_id',
                    'trip.product:id,name,description,water_route_id',
                    'trip.product.waterRoute:id,duration_minutes',
                    'bookingTickets.ticketType:id,title',
                ])
                ->first();

            if ($booking === null || $booking->trashed()) {
                return;
            }

            Notification::route('mail', $contactEmail)
                ->notify(new BookingModifiedNotification($booking, mailLocale: $locale));
        });
    }
}
