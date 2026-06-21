<?php

namespace App\Console\Commands;

use App\Actions\CancelPublicBookingAction;
use App\Models\Booking;
use App\Notifications\BookingDepartureReminderNotification;
use App\Support\AppLocale;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;

class SendBookingDepartureRemindersCommand extends Command
{
    protected $signature = 'bookings:send-departure-reminders';

    protected $description = 'Send departure reminder emails for public bookings departing in ~24 hours.';

    public function handle(CancelPublicBookingAction $cancelAction): int
    {
        $sentCount = 0;

        Booking::query()
            ->whereNotNull('cancel_token_hash')
            ->whereNull('departure_reminder_sent_at')
            ->whereHas('trip', static function ($query): void {
                $query->whereBetween('scheduled_departure_at', [
                    now()->addHours(24),
                    now()->addHours(25),
                ]);
            })
            ->with([
                'program:id,name,email_signature,timezone',
                'trip:id,scheduled_departure_at,product_id',
                'trip.product:id,name,description',
                'trip.voyages:id,trip_id,status',
                'checkIn:id,booking_id',
                'bookingTickets.ticketType:id,title',
            ])
            ->chunkById(100, function ($bookings) use ($cancelAction, &$sentCount): void {
                foreach ($bookings as $booking) {
                    if ($cancelAction->cancellationBlockReason($booking) !== null) {
                        continue;
                    }

                    $locale = AppLocale::normalize($booking->contact_locale);

                    Notification::route('mail', $booking->contact_email)
                        ->notify(new BookingDepartureReminderNotification($booking, mailLocale: $locale));

                    $booking->update(['departure_reminder_sent_at' => now()]);
                    $sentCount++;
                }
            });

        $this->info("Sent {$sentCount} departure reminder(s).");

        return self::SUCCESS;
    }
}
