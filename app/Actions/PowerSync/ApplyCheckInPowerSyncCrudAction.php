<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\CheckIns\CheckInPatchData;
use App\Data\PowerSync\CheckIns\CheckInPutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Enums\VoyageStatus;
use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Voyage;
use App\Support\Voyages\VoyageProgramResolver;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

final class ApplyCheckInPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $checkIn = CheckIn::query()->whereKey($id)->first();

            if ($checkIn === null) {
                return;
            }

            $voyage = Voyage::query()->whereKey($checkIn->voyage_id)->first();

            if ($voyage !== null) {
                $this->assertVoyageAllowsCheckInEdits($voyage, $userId);
            }

            $checkIn->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = CheckInPutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $dto = CheckInPatchData::validateAndCreate($raw);
            $this->applyPatch($id, $dto, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for check_ins: '.$op);
    }

    private function applyPut(string $id, CheckInPutData $dto, string $userId): void
    {
        $existing = CheckIn::query()->whereKey($id)->first();

        $bookingId = $dto->booking_id instanceof Optional
            ? ($existing?->booking_id ?? null)
            : $dto->booking_id;
        $voyageId = $dto->voyage_id instanceof Optional
            ? ($existing?->voyage_id ?? null)
            : $dto->voyage_id;

        if ($bookingId === null || $voyageId === null) {
            throw ValidationException::withMessages([
                'data' => __('Check-in requires a booking and departure.'),
            ]);
        }

        $voyage = Voyage::query()->whereKey($voyageId)->first();

        if ($voyage === null) {
            throw ValidationException::withMessages([
                'voyage_id' => __('The selected departure is invalid.'),
            ]);
        }

        $this->assertVoyageAllowsCheckInEdits($voyage, $userId);
        $this->assertBookingBelongsToVoyage($bookingId, $voyage);
        $this->assertUniqueBookingCheckIn($bookingId, $id);

        $notes = $dto->notes instanceof Optional
            ? ($existing?->notes ?? null)
            : $dto->notes;

        CheckIn::query()->updateOrCreate(
            ['id' => $id],
            [
                'booking_id' => $bookingId,
                'voyage_id' => $voyageId,
                'notes' => $notes,
            ],
        );
    }

    private function applyPatch(string $id, CheckInPatchData $patch, string $userId): void
    {
        $checkIn = CheckIn::query()->whereKey($id)->first();

        if ($checkIn === null) {
            return;
        }

        $voyage = Voyage::query()->whereKey($checkIn->voyage_id)->first();

        if ($voyage === null) {
            return;
        }

        $this->assertVoyageAllowsCheckInEdits($voyage, $userId);

        if (! ($patch->voyage_id instanceof Optional) && $patch->voyage_id !== null) {
            $nextVoyage = Voyage::query()->whereKey($patch->voyage_id)->first();

            if ($nextVoyage === null) {
                throw ValidationException::withMessages([
                    'voyage_id' => __('The selected departure is invalid.'),
                ]);
            }

            $this->assertVoyageAllowsCheckInEdits($nextVoyage, $userId);
            $checkIn->voyage_id = $patch->voyage_id;
            $voyage = $nextVoyage;
        }

        if (! ($patch->booking_id instanceof Optional)) {
            if ($patch->booking_id === null) {
                throw ValidationException::withMessages([
                    'booking_id' => __('Check-in requires a booking.'),
                ]);
            }

            $this->assertBookingBelongsToVoyage($patch->booking_id, $voyage);
            $this->assertUniqueBookingCheckIn($patch->booking_id, $id);
            $checkIn->booking_id = $patch->booking_id;
        }

        if (! ($patch->notes instanceof Optional)) {
            $checkIn->notes = $patch->notes;
        }

        $checkIn->save();
    }

    private function assertVoyageAllowsCheckInEdits(Voyage $voyage, string $userId): void
    {
        VoyageProgramResolver::assertProgramManaged($voyage, $userId);

        if ($voyage->status === VoyageStatus::Completed) {
            throw ValidationException::withMessages([
                'voyage' => __('Check-ins cannot be changed after the departure has arrived.'),
            ]);
        }
    }

    private function assertBookingBelongsToVoyage(string $bookingId, Voyage $voyage): void
    {
        $booking = Booking::query()->whereKey($bookingId)->first();

        if ($booking === null) {
            throw ValidationException::withMessages([
                'booking_id' => __('The selected booking is invalid.'),
            ]);
        }

        if ((string) $booking->program_id !== (string) $voyage->program_id) {
            throw ValidationException::withMessages([
                'booking_id' => __('The booking must belong to the same program as this departure.'),
            ]);
        }

        if ($voyage->trip_id === null) {
            throw ValidationException::withMessages([
                'booking_id' => __('Bookings can only be linked on departures tied to a trip.'),
            ]);
        }

        if ((string) $booking->trip_id !== (string) $voyage->trip_id) {
            throw ValidationException::withMessages([
                'booking_id' => __('The booking must belong to the same trip as this departure.'),
            ]);
        }
    }

    private function assertUniqueBookingCheckIn(string $bookingId, string $checkInId): void
    {
        $existing = CheckIn::query()
            ->where('booking_id', $bookingId)
            ->whereKeyNot($checkInId)
            ->first();

        if ($existing !== null) {
            throw ValidationException::withMessages([
                'booking_id' => __('This booking is already checked in.'),
            ]);
        }
    }
}
