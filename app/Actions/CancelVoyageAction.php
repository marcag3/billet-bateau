<?php

namespace App\Actions;

use App\Enums\VoyageStatus;
use App\Models\Booking;
use App\Models\Voyage;
use App\Notifications\BookingCancellationNotification;
use App\Support\AppLocale;
use App\Support\Voyages\VoyageProgramResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;

final class CancelVoyageAction
{
    use AsAction;

    public function handle(Voyage $voyage, string $userId): Voyage
    {
        $voyage = Voyage::query()->whereKey($voyage->getKey())->firstOrFail();

        VoyageProgramResolver::assertProgramManaged($voyage, $userId);

        if ($voyage->status === VoyageStatus::Cancelled) {
            return $voyage;
        }

        if (
            $voyage->status === VoyageStatus::Underway
            || $voyage->status === VoyageStatus::Completed
        ) {
            throw ValidationException::withMessages([
                'voyage' => __('This trip cannot be cancelled after departure.'),
            ]);
        }

        $tripId = $voyage->trip_id !== null ? (string) $voyage->trip_id : null;

        if ($tripId === null) {
            throw ValidationException::withMessages([
                'voyage' => __('This departure is not linked to a trip and cannot be cancelled.'),
            ]);
        }

        $bookings = Booking::query()
            ->where('trip_id', $tripId)
            ->with([
                'program:id,name,email_signature,timezone',
                'trip:id,scheduled_departure_at,product_id',
                'trip.product:id,name,description,banner_object_key,boat_type_id',
                'trip.product.boatType:id,banner_object_key',
                'bookingTickets.ticketType:id,title',
            ])
            ->get();

        DB::transaction(function () use ($voyage, $bookings, $userId): void {
            foreach ($bookings as $booking) {
                $locale = AppLocale::normalize($booking->contact_locale);
                $contactEmail = $booking->contact_email;

                $booking->delete();

                Notification::route('mail', $contactEmail)
                    ->notify(new BookingCancellationNotification($booking, mailLocale: $locale));
            }

            $voyage->passengers()->delete();
            $voyage->status = VoyageStatus::Cancelled;
            $voyage->user_id ??= $userId;
            $voyage->save();
        });

        return $voyage->fresh() ?? $voyage;
    }
}
