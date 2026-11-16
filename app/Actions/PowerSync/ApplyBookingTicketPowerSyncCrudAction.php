<?php

namespace App\Actions\PowerSync;

use App\Actions\SendBookingModifiedNotificationAction;
use App\Data\PowerSync\BookingTickets\BookingTicketPatchData;
use App\Data\PowerSync\BookingTickets\BookingTicketPutData;
use App\Data\PowerSync\BookingTickets\BookingTicketPutPayloadResolver;
use App\Data\PowerSync\BookingTickets\BookingTicketResolvedPutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Models\Booking;
use App\Models\BookingTicket;
use App\Models\Program;
use App\Models\TicketType;
use App\Models\Trip;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see BookingTicket} rows (booking_tickets upload type).
 *
 * Idempotent semantics: {@see PowerSyncCrudEntryData::OP_PATCH} and {@see PowerSyncCrudEntryData::OP_DELETE}
 * no-op when the target row does not exist, or when a {@see BookingTicket} row has no resolvable {@see Booking}
 * for authorization (offline client retries safe).
 *
 * @extends PowerSyncCrudAction<BookingTicketPutData, BookingTicketPatchData>
 */
final class ApplyBookingTicketPowerSyncCrudAction extends PowerSyncCrudAction
{
    protected function tableName(): string
    {
        return 'booking_tickets';
    }

    protected function putDataClass(): string
    {
        return BookingTicketPutData::class;
    }

    protected function patchDataClass(): string
    {
        return BookingTicketPatchData::class;
    }

    protected function applyDelete(string $id, string $userId): void
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
        $bookingTicket->delete();
    }

    /**
     * @param  BookingTicketPutData  $dto
     */
    protected function applyPut(string $id, Data $dto, string $userId): void
    {
        $existing = BookingTicket::query()->whereKey($id)->first();

        if ($existing !== null) {
            $existingBooking = Booking::withTrashed()->whereKey($existing->booking_id)->first();
            $this->assertProgramManaged($existingBooking === null ? null : (string) $existingBooking->program_id, $userId);
        }

        $merged = BookingTicketPutPayloadResolver::resolve($dto, $existing);
        $resolved = BookingTicketResolvedPutData::validateAndCreate($merged);

        $booking = Booking::query()->whereKey($resolved->booking_id)->first();
        if ($booking === null) {
            throw ValidationException::withMessages([
                'data.booking_id' => 'Booking not found.',
            ]);
        }

        $this->assertProgramManaged((string) $booking->program_id, $userId);
        $this->assertBookingNotCancelled($booking);

        $ticketType = TicketType::query()->whereKey($resolved->ticket_type_id)->first();
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

        $program = Program::query()->whereKey($booking->program_id)->first();
        $this->assertCustomQuestionAnswers($program, $resolved->custom_fields);
        $this->assertTripHasCapacity($booking, $id);

        BookingTicket::query()->updateOrCreate(
            ['id' => $id],
            [
                'booking_id' => $resolved->booking_id,
                'ticket_type_id' => $resolved->ticket_type_id,
                'name' => $resolved->name,
                'email' => $resolved->email,
                'country' => $resolved->country,
                'custom_fields' => $resolved->custom_fields,
                'waiver_confirmation_id' => $resolved->waiver_confirmation_id,
            ],
        );
    }

    /**
     * @param  BookingTicketPatchData  $dto
     */
    protected function applyPatch(string $id, Data $dto, string $userId): void
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
        $this->assertBookingNotCancelled($booking);

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
            $this->assertBookingNotCancelled($nextBooking);
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
            $bookingTicket->email = $dto->email === null || trim((string) $dto->email) === ''
                ? null
                : trim((string) $dto->email);
        }

        if (! ($dto->country instanceof Optional)) {
            if ($dto->country === null) {
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

        if ($bookingTicket->wasChanged()) {
            SendBookingModifiedNotificationAction::run($booking);
        }
    }

    /**
     * @param  array<string, mixed>  $customFields
     */
    private function assertCustomQuestionAnswers(?Program $program, array $customFields): void
    {
        if ($program === null) {
            return;
        }

        $configuredQuestions = collect($program->booking_questions ?? [])
            ->map(static fn ($question): string => trim((string) $question))
            ->filter(static fn (string $question): bool => $question !== '')
            ->values()
            ->all();

        foreach ($configuredQuestions as $question) {
            $answer = trim((string) ($customFields[$question] ?? ''));
            if ($answer === '') {
                throw ValidationException::withMessages([
                    'data.custom_fields' => __('Answers are required for all configured booking questions.'),
                ]);
            }
        }
    }

    private function assertTripHasCapacity(Booking $booking, string $excludingTicketId): void
    {
        $tripId = $booking->trip_id;
        if ($tripId === null) {
            return;
        }

        $trip = Trip::query()->whereKey($tripId)->with('product')->first();

        if ($trip === null) {
            throw ValidationException::withMessages([
                'data.booking_id' => __('The selected trip is invalid.'),
            ]);
        }

        $product = $trip->product;
        if ($product === null) {
            throw ValidationException::withMessages([
                'data.booking_id' => __('The selected trip is not available for booking.'),
            ]);
        }

        $usedSeats = BookingTicket::query()
            ->whereHas('booking', static function ($query) use ($tripId): void {
                $query->where('trip_id', $tripId);
            })
            ->whereKeyNot($excludingTicketId)
            ->count();

        if ($usedSeats + 1 > (int) $product->capacity) {
            throw ValidationException::withMessages([
                'data' => __('This trip does not have enough remaining capacity.'),
            ]);
        }
    }

    private function assertBookingNotCancelled(Booking $booking): void
    {
        if ($booking->trashed()) {
            throw ValidationException::withMessages([
                'booking' => __('This booking has been cancelled and cannot be modified.'),
            ]);
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
