<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\Passengers\PassengerPatchData;
use App\Data\PowerSync\Passengers\PassengerPutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Enums\VoyageStatus;
use App\Models\Booking;
use App\Models\Passenger;
use App\Models\Voyage;
use App\Support\Voyages\VoyageProgramResolver;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

final class ApplyPassengerPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $passenger = Passenger::query()->whereKey($id)->first();

            if ($passenger === null) {
                return;
            }

            $voyage = Voyage::query()->whereKey($passenger->voyage_id)->first();

            if ($voyage === null) {
                return;
            }

            $this->assertVoyageAllowsManifestEdits($voyage, $userId);
            $passenger->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = PassengerPutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $dto = PassengerPatchData::validateAndCreate($raw);
            $this->applyPatch($id, $dto, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for passengers: '.$op);
    }

    private function applyPut(string $id, PassengerPutData $dto, string $userId): void
    {
        $voyageId = $dto->voyage_id instanceof Optional ? null : $dto->voyage_id;
        $name = $dto->name instanceof Optional ? null : $dto->name;

        if ($voyageId === null || $name === null || trim($name) === '') {
            throw ValidationException::withMessages([
                'data' => __('Passenger voyage and name are required.'),
            ]);
        }

        $voyage = Voyage::query()->whereKey($voyageId)->first();

        if ($voyage === null) {
            throw ValidationException::withMessages([
                'voyage_id' => __('The selected departure is invalid.'),
            ]);
        }

        $this->assertVoyageAllowsManifestEdits($voyage, $userId);

        $bookingId = $dto->booking_id instanceof Optional ? null : $dto->booking_id;
        $this->assertBookingBelongsToVoyageTrip($bookingId, $voyage);

        Passenger::query()->updateOrCreate(
            ['id' => $id],
            [
                'voyage_id' => $voyageId,
                'name' => trim($name),
                'booking_id' => $bookingId,
                'check_in_id' => $dto->check_in_id instanceof Optional ? null : $dto->check_in_id,
                'notes' => $dto->notes instanceof Optional ? null : $dto->notes,
            ],
        );
    }

    private function applyPatch(string $id, PassengerPatchData $patch, string $userId): void
    {
        $passenger = Passenger::query()->whereKey($id)->first();

        if ($passenger === null) {
            return;
        }

        $voyage = Voyage::query()->whereKey($passenger->voyage_id)->first();

        if ($voyage === null) {
            return;
        }

        $this->assertVoyageAllowsManifestEdits($voyage, $userId);

        if (! ($patch->voyage_id instanceof Optional) && $patch->voyage_id !== null) {
            $nextVoyage = Voyage::query()->whereKey($patch->voyage_id)->first();

            if ($nextVoyage === null) {
                throw ValidationException::withMessages([
                    'voyage_id' => __('The selected departure is invalid.'),
                ]);
            }

            $this->assertVoyageAllowsManifestEdits($nextVoyage, $userId);
            $passenger->voyage_id = $patch->voyage_id;
            $voyage = $nextVoyage;
        }

        if (! ($patch->name instanceof Optional) && $patch->name !== null) {
            $passenger->name = trim($patch->name);
        }

        if (! ($patch->booking_id instanceof Optional)) {
            $this->assertBookingBelongsToVoyageTrip($patch->booking_id, $voyage);
            $passenger->booking_id = $patch->booking_id;
        }

        if (! ($patch->check_in_id instanceof Optional)) {
            $passenger->check_in_id = $patch->check_in_id;
        }

        if (! ($patch->notes instanceof Optional)) {
            $passenger->notes = $patch->notes;
        }

        $passenger->save();
    }

    private function assertVoyageAllowsManifestEdits(Voyage $voyage, string $userId): void
    {
        VoyageProgramResolver::assertProgramManaged($voyage, $userId);

        if ($voyage->status === VoyageStatus::Completed) {
            throw ValidationException::withMessages([
                'voyage' => __('Passengers cannot be changed after the departure has arrived.'),
            ]);
        }
    }

    private function assertBookingBelongsToVoyageTrip(?string $bookingId, Voyage $voyage): void
    {
        if ($bookingId === null) {
            return;
        }

        $booking = Booking::query()->whereKey($bookingId)->first();

        if ($booking === null) {
            throw ValidationException::withMessages([
                'booking_id' => __('The selected booking is invalid.'),
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
}
