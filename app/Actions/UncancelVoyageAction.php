<?php

namespace App\Actions;

use App\Enums\VoyageStatus;
use App\Models\Booking;
use App\Models\Voyage;
use App\Notifications\BookingReactivationNotification;
use App\Support\AppLocale;
use App\Support\Voyages\VoyageProgramResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;

final class UncancelVoyageAction
{
    use AsAction;

    public function handle(Voyage $voyage, string $userId): Voyage
    {
        $voyage = Voyage::query()->whereKey($voyage->getKey())->firstOrFail();

        VoyageProgramResolver::assertProgramManaged($voyage, $userId);

        if ($voyage->status !== VoyageStatus::Cancelled) {
            throw ValidationException::withMessages([
                'voyage' => __('Only a cancelled departure can be uncancelled.'),
            ]);
        }

        $trip = $voyage->trip;

        if ($trip === null) {
            throw ValidationException::withMessages([
                'voyage' => __('This departure is not linked to a trip and cannot be uncancelled.'),
            ]);
        }

        if ($trip->scheduled_departure_at->isPast()) {
            throw ValidationException::withMessages([
                'voyage' => __('This trip cannot be uncancelled after departure.'),
            ]);
        }

        $bookingsToRestore = Booking::onlyTrashed()
            ->where('cancelled_by_voyage_id', $voyage->getKey())
            ->with([
                'program:id,name,email_signature,timezone',
                'trip:id,scheduled_departure_at,product_id',
                'trip.product:id,name,description,banner_object_key,boat_type_id',
                'trip.product.boatType:id,banner_object_key',
                'bookingTickets.ticketType:id,title',
            ])
            ->get();

        $createdForTripCancellation = $voyage->cancelled_from_status === null;

        DB::transaction(function () use ($voyage, $bookingsToRestore, $createdForTripCancellation, $userId): void {
            foreach ($bookingsToRestore as $booking) {
                $booking->cancelled_by_voyage_id = null;
                $booking->restore();
            }

            if ($createdForTripCancellation) {
                $voyage->delete();

                return;
            }

            $restoredStatus = VoyageStatus::tryFrom((string) $voyage->cancelled_from_status)
                ?? VoyageStatus::Ready;

            if (
                $restoredStatus !== VoyageStatus::Draft
                && $restoredStatus !== VoyageStatus::Ready
            ) {
                $restoredStatus = VoyageStatus::Ready;
            }

            $voyage->status = $restoredStatus;
            $voyage->cancelled_from_status = null;
            $voyage->user_id ??= $userId;
            $voyage->save();
        });

        foreach ($bookingsToRestore as $booking) {
            $contactEmail = $booking->contact_email;

            if ($contactEmail === null || trim($contactEmail) === '') {
                continue;
            }

            $locale = AppLocale::normalize($booking->contact_locale);

            Notification::route('mail', $contactEmail)
                ->notify(new BookingReactivationNotification($booking, mailLocale: $locale));
        }

        return $voyage->fresh() ?? $voyage;
    }
}
