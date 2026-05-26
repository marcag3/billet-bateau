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
                ->with('product')
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

            $product = $trip->product;
            if ($product === null) {
                throw ValidationException::withMessages([
                    'trip_id' => [__('The selected trip is not available for this program.')],
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
            }

            $this->assertTicketDependencyConstraints($normalizedQuantities, $ticketTypes);

            $configuredQuestions = collect($program->booking_questions ?? [])
                ->map(static fn ($question): string => trim((string) $question))
                ->filter(static fn (string $question): bool => $question !== '')
                ->values()
                ->all();

            $providedAnswers = collect($data->custom_answers)
                ->map(static fn ($answer): string => trim((string) $answer))
                ->values()
                ->all();

            if (count($providedAnswers) !== count($configuredQuestions)) {
                throw ValidationException::withMessages([
                    'custom_answers' => [__('Answers are required for all configured booking questions.')],
                ]);
            }

            $customFieldMap = [];
            foreach ($configuredQuestions as $index => $question) {
                $answer = $providedAnswers[$index] ?? '';
                if ($answer === '') {
                    throw ValidationException::withMessages([
                        'custom_answers' => [__('Answers are required for all configured booking questions.')],
                    ]);
                }
                $customFieldMap[$question] = $answer;
            }

            $usedSeats = BookingTicket::query()
                ->whereHas('booking', static function ($query) use ($trip): void {
                    $query->where('trip_id', $trip->getKey());
                })
                ->count();

            if ($usedSeats + $totalTickets > (int) $product->capacity) {
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
                        'custom_fields' => $customFieldMap,
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

    /**
     * @param  array<string, int>  $quantities
     * @param  Collection<string, TicketType>  $ticketTypes
     *
     * @throws ValidationException
     */
    private function assertTicketDependencyConstraints(array $quantities, Collection $ticketTypes): void
    {
        foreach ($ticketTypes as $ticketType) {
            $dependsOnTicketTypeId = $ticketType->depends_on_ticket_type_id;
            $maxPerReferenceTicket = $ticketType->max_per_reference_ticket;

            if ($dependsOnTicketTypeId === null || $maxPerReferenceTicket === null) {
                continue;
            }

            $dependentTicketTypeId = (string) $ticketType->getKey();
            $dependentQuantity = (int) ($quantities[$dependentTicketTypeId] ?? 0);

            if ($dependentQuantity <= 0) {
                continue;
            }

            $referenceTicketType = $ticketTypes->get((string) $dependsOnTicketTypeId)
                ?? TicketType::query()->whereKey($dependsOnTicketTypeId)->first();

            if ($referenceTicketType === null) {
                throw ValidationException::withMessages([
                    "ticket_quantities.{$dependentTicketTypeId}" => [__('Invalid ticket dependency configuration.')],
                ]);
            }

            $referenceQuantity = (int) ($quantities[(string) $dependsOnTicketTypeId] ?? 0);

            if ($referenceQuantity <= 0) {
                throw ValidationException::withMessages([
                    "ticket_quantities.{$dependentTicketTypeId}" => [__('Select at least one :reference ticket before adding :dependent tickets.', [
                        'reference' => $referenceTicketType->title,
                        'dependent' => $ticketType->title,
                    ])],
                ]);
            }

            $allowedDependentQuantity = $referenceQuantity * (int) $maxPerReferenceTicket;

            if ($dependentQuantity > $allowedDependentQuantity) {
                throw ValidationException::withMessages([
                    "ticket_quantities.{$dependentTicketTypeId}" => [__('You may select at most :max :dependent ticket(s) per :reference ticket.', [
                        'max' => $maxPerReferenceTicket,
                        'dependent' => $ticketType->title,
                        'reference' => $referenceTicketType->title,
                    ])],
                ]);
            }
        }
    }
}
