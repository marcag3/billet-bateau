<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\BookingTickets\BookingTicketPatchData;
use App\Data\PowerSync\BookingTickets\BookingTicketPutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\Program;
use App\Models\TicketType;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see BookingTicket} rows (booking_tickets upload type).
 */
final class ApplyBookingTicketPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, int $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $bookingTicket = BookingTicket::query()->whereKey($id)->first();

            if ($bookingTicket === null) {
                return;
            }

            $booking = Booking::query()->whereKey($bookingTicket->booking_id)->first();
            if ($booking === null) {
                return;
            }

            $this->assertProgramManaged((string) $booking->program_id, $userId);
            $bookingTicket->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = BookingTicketPutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $dto = BookingTicketPatchData::validateAndCreate($raw);
            $this->applyPatch($id, $dto, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for booking_tickets: '.$op);
    }

    private function applyPut(string $id, BookingTicketPutData $dto, int $userId): void
    {
        $existing = BookingTicket::query()->whereKey($id)->first();

        $bookingId = $dto->booking_id instanceof Optional ? ($existing?->booking_id ?? null) : $dto->booking_id;
        $ticketTypeId = $dto->ticket_type_id instanceof Optional ? ($existing?->ticket_type_id ?? null) : $dto->ticket_type_id;

        if ($bookingId === null || $bookingId === '') {
            throw ValidationException::withMessages([
                'data.booking_id' => 'Booking is required.',
            ]);
        }

        if ($ticketTypeId === null || $ticketTypeId === '') {
            throw ValidationException::withMessages([
                'data.ticket_type_id' => 'Ticket type is required.',
            ]);
        }

        $booking = Booking::query()->whereKey($bookingId)->first();
        if ($booking === null) {
            throw ValidationException::withMessages([
                'data.booking_id' => 'Booking not found.',
            ]);
        }

        $this->assertProgramManaged((string) $booking->program_id, $userId);

        $ticketType = TicketType::query()->whereKey($ticketTypeId)->first();
        if ($ticketType === null) {
            throw ValidationException::withMessages([
                'data.ticket_type_id' => 'Ticket type not found.',
            ]);
        }

        if ((string) $ticketType->program_id !== (string) $booking->program_id) {
            throw ValidationException::withMessages([
                'data.ticket_type_id' => 'Ticket type must belong to the booking program.',
            ]);
        }

        $name = $dto->name instanceof Optional ? ($existing?->name ?? null) : $dto->name;
        $email = $dto->email instanceof Optional ? ($existing?->email ?? null) : $dto->email;
        $country = $dto->country instanceof Optional ? ($existing?->country ?? null) : $dto->country;
        $customFields = $dto->custom_fields instanceof Optional
            ? ($existing?->custom_fields ?? [])
            : $this->normalizeCustomFields($dto->custom_fields);
        $waiverConfirmationId = $dto->waiver_confirmation_id instanceof Optional
            ? $existing?->waiver_confirmation_id
            : $dto->waiver_confirmation_id;

        if ($name === null || $name === '') {
            throw ValidationException::withMessages([
                'data.name' => 'Name is required.',
            ]);
        }

        if ($email === null || $email === '') {
            throw ValidationException::withMessages([
                'data.email' => 'Email is required.',
            ]);
        }

        if ($country === null || $country === '') {
            throw ValidationException::withMessages([
                'data.country' => 'Country is required.',
            ]);
        }

        BookingTicket::query()->updateOrCreate(
            ['id' => $id],
            [
                'booking_id' => $bookingId,
                'ticket_type_id' => $ticketTypeId,
                'name' => $name,
                'email' => $email,
                'country' => $country,
                'custom_fields' => $customFields,
                'waiver_confirmation_id' => $waiverConfirmationId,
            ],
        );
    }

    private function applyPatch(string $id, BookingTicketPatchData $dto, int $userId): void
    {
        $bookingTicket = BookingTicket::query()->whereKey($id)->first();

        if ($bookingTicket === null) {
            return;
        }

        $booking = Booking::query()->whereKey($bookingTicket->booking_id)->first();
        if ($booking === null) {
            return;
        }

        $this->assertProgramManaged((string) $booking->program_id, $userId);

        if (! ($dto->booking_id instanceof Optional)) {
            if ($dto->booking_id === null || $dto->booking_id === '') {
                throw ValidationException::withMessages([
                    'data.booking_id' => 'Booking is required.',
                ]);
            }

            $nextBooking = Booking::query()->whereKey($dto->booking_id)->first();
            if ($nextBooking === null) {
                throw ValidationException::withMessages([
                    'data.booking_id' => 'Booking not found.',
                ]);
            }

            $this->assertProgramManaged((string) $nextBooking->program_id, $userId);
            $bookingTicket->booking_id = $dto->booking_id;
            $booking = $nextBooking;
        }

        if (! ($dto->ticket_type_id instanceof Optional)) {
            if ($dto->ticket_type_id === null || $dto->ticket_type_id === '') {
                throw ValidationException::withMessages([
                    'data.ticket_type_id' => 'Ticket type is required.',
                ]);
            }

            $ticketType = TicketType::query()->whereKey($dto->ticket_type_id)->first();
            if ($ticketType === null) {
                throw ValidationException::withMessages([
                    'data.ticket_type_id' => 'Ticket type not found.',
                ]);
            }

            if ((string) $ticketType->program_id !== (string) $booking->program_id) {
                throw ValidationException::withMessages([
                    'data.ticket_type_id' => 'Ticket type must belong to the booking program.',
                ]);
            }

            $bookingTicket->ticket_type_id = $dto->ticket_type_id;
        }

        if (! ($dto->name instanceof Optional)) {
            if ($dto->name === null || $dto->name === '') {
                throw ValidationException::withMessages([
                    'data.name' => 'Name is required.',
                ]);
            }
            $bookingTicket->name = $dto->name;
        }

        if (! ($dto->email instanceof Optional)) {
            if ($dto->email === null || $dto->email === '') {
                throw ValidationException::withMessages([
                    'data.email' => 'Email is required.',
                ]);
            }
            $bookingTicket->email = $dto->email;
        }

        if (! ($dto->country instanceof Optional)) {
            if ($dto->country === null || $dto->country === '') {
                throw ValidationException::withMessages([
                    'data.country' => 'Country is required.',
                ]);
            }
            $bookingTicket->country = $dto->country;
        }

        if (! ($dto->custom_fields instanceof Optional)) {
            $bookingTicket->custom_fields = $this->normalizeCustomFields($dto->custom_fields);
        }

        if (! ($dto->waiver_confirmation_id instanceof Optional)) {
            $bookingTicket->waiver_confirmation_id = $dto->waiver_confirmation_id;
        }

        $bookingTicket->save();
    }

    private function assertProgramManaged(string $programId, int $userId): void
    {
        $program = Program::query()->whereKey($programId)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }
    }

    /**
     * @param  array<string, mixed>|string  $rawFields
     * @return array<string, mixed>
     */
    private function normalizeCustomFields(array|string $rawFields): array
    {
        if (is_array($rawFields)) {
            return $rawFields;
        }

        if ($rawFields === '') {
            return [];
        }

        $decoded = json_decode($rawFields, true);
        if (! is_array($decoded)) {
            throw ValidationException::withMessages([
                'data.custom_fields' => 'Custom fields must be a valid JSON object.',
            ]);
        }

        return $decoded;
    }
}
