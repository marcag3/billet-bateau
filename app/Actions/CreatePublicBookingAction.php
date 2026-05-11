<?php

namespace App\Actions;

use App\Data\Programs\PublicBookingCreatedData;
use App\Data\Programs\PublicBookingStoreData;
use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\Program;
use App\Models\TicketType;
use App\Models\Trip;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreatePublicBookingAction
{
    /**
     * @throws ValidationException
     */
    public function handle(Program $program, PublicBookingStoreData $data): PublicBookingCreatedData
    {
        return DB::transaction(function () use ($program, $data): PublicBookingCreatedData {
            /** @var array<string, int> $normalizedQuantities */
            $normalizedQuantities = [];
            foreach ($data->ticket_quantities as $typeId => $quantity) {
                $normalizedQuantities[(string) $typeId] = (int) $quantity;
            }

            $trip = Trip::query()
                ->where('program_id', $program->getKey())
                ->whereKey($data->trip_id)
                ->lockForUpdate()
                ->first();

            if ($trip === null) {
                throw ValidationException::withMessages([
                    'trip_id' => [__('The selected trip is not available for this program.')],
                ]);
            }

            if ($trip->scheduled_departure_at->isPast()) {
                throw ValidationException::withMessages([
                    'trip_id' => [__('This trip is no longer available for booking.')],
                ]);
            }

            $nonZeroQuantities = array_filter(
                $normalizedQuantities,
                static fn (int $quantity): bool => $quantity > 0,
            );

            if ($nonZeroQuantities === []) {
                throw ValidationException::withMessages([
                    'ticket_quantities' => [__('Select at least one ticket.')],
                ]);
            }

            foreach (array_keys($normalizedQuantities) as $ticketTypeId) {
                if (! Str::isUlid((string) $ticketTypeId)) {
                    throw ValidationException::withMessages([
                        'ticket_quantities' => [__('Invalid ticket selection.')],
                    ]);
                }
            }

            $requestedTypeIds = array_keys($nonZeroQuantities);

            /** @var Collection<string, TicketType> $ticketTypes */
            $ticketTypes = TicketType::query()
                ->where('program_id', $program->getKey())
                ->whereIn('id', $requestedTypeIds)
                ->get()
                ->keyBy(static fn (TicketType $t): string => (string) $t->getKey());

            if ($ticketTypes->count() !== count($requestedTypeIds)) {
                throw ValidationException::withMessages([
                    'ticket_quantities' => [__('One or more ticket types are not valid for this program.')],
                ]);
            }

            $totalTickets = array_sum($nonZeroQuantities);

            foreach ($nonZeroQuantities as $ticketTypeId => $quantity) {
                /** @var TicketType $ticketType */
                $ticketType = $ticketTypes->get((string) $ticketTypeId);
                if ($quantity < $ticketType->min_per_purchase) {
                    throw ValidationException::withMessages([
                        "ticket_quantities.{$ticketTypeId}" => [__('You must select at least :min tickets for :title.', [
                            'min' => $ticketType->min_per_purchase,
                            'title' => $ticketType->title,
                        ])],
                    ]);
                }

                if ($ticketType->max_per_purchase !== null && $quantity > $ticketType->max_per_purchase) {
                    throw ValidationException::withMessages([
                        "ticket_quantities.{$ticketTypeId}" => [__('You may select at most :max tickets for :title.', [
                            'max' => $ticketType->max_per_purchase,
                            'title' => $ticketType->title,
                        ])],
                    ]);
                }

                $caps = $ticketType->trip_inventory_caps;
                if (! is_array($caps)) {
                    $caps = [];
                }

                $tripKey = (string) $trip->getKey();
                if (array_key_exists($tripKey, $caps)) {
                    $cap = $caps[$tripKey];
                    if ($cap !== null) {
                        if (! is_int($cap) || $cap < 0) {
                            throw ValidationException::withMessages([
                                'trip_id' => [__('This trip cannot be booked right now. Please try again later.')],
                            ]);
                        }

                        $soldForTypeOnTrip = BookingTicket::query()
                            ->where('ticket_type_id', $ticketTypeId)
                            ->whereHas('booking', static function ($query) use ($trip): void {
                                $query->where('trip_id', $trip->getKey());
                            })
                            ->count();

                        if ($soldForTypeOnTrip + $quantity > $cap) {
                            throw ValidationException::withMessages([
                                "ticket_quantities.{$ticketTypeId}" => [__('Not enough tickets remain for :title on this trip.', [
                                    'title' => $ticketType->title,
                                ])],
                            ]);
                        }
                    }
                }
            }

            $usedSeats = BookingTicket::query()
                ->whereHas('booking', static function ($query) use ($trip): void {
                    $query->where('trip_id', $trip->getKey());
                })
                ->count();

            if ($usedSeats + $totalTickets > (int) $trip->capacity) {
                throw ValidationException::withMessages([
                    'ticket_quantities' => [__('This trip does not have enough remaining capacity.')],
                ]);
            }

            $bookingId = (string) Str::ulid();

            Booking::query()->create([
                'id' => $bookingId,
                'program_id' => $program->getKey(),
                'trip_id' => $trip->getKey(),
                'contact_name' => $data->contact_name,
                'contact_email' => $data->contact_email,
            ]);

            foreach ($nonZeroQuantities as $ticketTypeId => $quantity) {
                for ($i = 0; $i < $quantity; $i++) {
                    BookingTicket::query()->create([
                        'id' => (string) Str::ulid(),
                        'booking_id' => $bookingId,
                        'ticket_type_id' => (string) $ticketTypeId,
                        'name' => $data->contact_name,
                        'email' => $data->contact_email,
                        'country' => '',
                        'custom_fields' => [],
                        'waiver_confirmation_id' => null,
                    ]);
                }
            }

            return new PublicBookingCreatedData(
                id: $bookingId,
                trip_id: (string) $trip->getKey(),
                total_tickets: $totalTickets,
                contact_name: $data->contact_name,
                contact_email: $data->contact_email,
            );
        });
    }
}
