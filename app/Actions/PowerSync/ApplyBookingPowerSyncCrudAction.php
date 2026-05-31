<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\Bookings\BookingPatchData;
use App\Data\PowerSync\Bookings\BookingPutData;
use App\Data\PowerSync\Bookings\BookingPutPayloadResolver;
use App\Data\PowerSync\Bookings\BookingResolvedPutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Models\Booking;
use App\Models\Program;
use App\Models\Trip;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see Booking} rows (bookings upload type).
 */
final class ApplyBookingPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $booking = Booking::query()->whereKey($id)->first();

            if ($booking === null) {
                return;
            }

            $this->assertProgramManaged((string) $booking->program_id, $userId);

            if ($booking->bookingTickets()->exists()) {
                throw ValidationException::withMessages([
                    'booking' => __('This booking has tickets and cannot be deleted.'),
                ]);
            }

            if ($booking->checkIn()->exists()) {
                throw ValidationException::withMessages([
                    'booking' => __('This booking has a check-in and cannot be deleted.'),
                ]);
            }

            $booking->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = BookingPutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $patch = BookingPatchData::validateAndCreate($raw);
            $this->applyPatch($id, $patch, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for bookings: '.$op);
    }

    private function applyPut(string $id, BookingPutData $dto, string $userId): void
    {
        $existing = Booking::query()->whereKey($id)->first();

        $programIdFromData = $dto->program_id instanceof Optional
            ? null
            : $dto->program_id;

        if ($existing !== null) {
            $programId = (string) $existing->program_id;
            if ($programIdFromData !== null && $programIdFromData !== $programId) {
                throw new AuthorizationException;
            }
        } else {
            $programId = $programIdFromData;
            if ($programId === null) {
                throw ValidationException::withMessages([
                    'data.program_id' => 'Program is required.',
                ]);
            }
        }

        $this->assertProgramManaged($programId, $userId);

        $merged = BookingPutPayloadResolver::resolve($dto, $existing);
        $resolved = BookingResolvedPutData::validateAndCreate($merged);

        $trip = $this->resolveTripForBooking($resolved->trip_id, $programId);

        Booking::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $programId,
                'trip_id' => $trip->getKey(),
                'contact_name' => $resolved->contact_name,
                'contact_email' => $resolved->contact_email,
            ],
        );
    }

    private function applyPatch(string $id, BookingPatchData $patch, string $userId): void
    {
        $booking = Booking::query()->whereKey($id)->first();

        if ($booking === null) {
            return;
        }

        $this->assertProgramManaged((string) $booking->program_id, $userId);

        if (! ($patch->program_id instanceof Optional)) {
            $incoming = $patch->program_id;
            if ($incoming !== null && $incoming !== (string) $booking->program_id) {
                throw new AuthorizationException;
            }
        }

        if (! ($patch->trip_id instanceof Optional)) {
            if ($patch->trip_id === null || $patch->trip_id === '') {
                throw ValidationException::withMessages([
                    'data.trip_id' => 'Trip is required.',
                ]);
            }

            $this->resolveTripForBooking($patch->trip_id, (string) $booking->program_id);
            $booking->trip_id = $patch->trip_id;
        }

        if (! ($patch->contact_name instanceof Optional)) {
            if ($patch->contact_name === null || trim($patch->contact_name) === '') {
                throw ValidationException::withMessages([
                    'data.contact_name' => 'Contact name is required.',
                ]);
            }
            $booking->contact_name = trim($patch->contact_name);
        }

        if (! ($patch->contact_email instanceof Optional)) {
            if ($patch->contact_email === null || trim($patch->contact_email) === '') {
                throw ValidationException::withMessages([
                    'data.contact_email' => 'Contact email is required.',
                ]);
            }
            $booking->contact_email = trim($patch->contact_email);
        }

        $booking->save();
    }

    private function resolveTripForBooking(string $tripId, string $programId): Trip
    {
        $trip = Trip::query()
            ->whereKey($tripId)
            ->where('program_id', $programId)
            ->first();

        if ($trip === null) {
            throw ValidationException::withMessages([
                'data.trip_id' => __('The selected trip is not available for this program.'),
            ]);
        }

        if ($trip->scheduled_departure_at->isPast()) {
            throw ValidationException::withMessages([
                'data.trip_id' => __('This trip is no longer available for booking.'),
            ]);
        }

        return $trip;
    }

    private function assertProgramManaged(string $programId, string $userId): void
    {
        $program = Program::query()->whereKey($programId)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }
    }
}
