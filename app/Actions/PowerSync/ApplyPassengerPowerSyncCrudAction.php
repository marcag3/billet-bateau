<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\Passengers\PassengerPatchData;
use App\Data\PowerSync\Passengers\PassengerPutData;
use App\Enums\VoyageStatus;
use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Passenger;
use App\Models\Voyage;
use App\Support\Voyages\VoyageProgramResolver;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * @extends PowerSyncCrudAction<PassengerPutData, PassengerPatchData>
 */
final class ApplyPassengerPowerSyncCrudAction extends PowerSyncCrudAction
{
    protected function tableName(): string
    {
        return 'passengers';
    }

    protected function putDataClass(): string
    {
        return PassengerPutData::class;
    }

    protected function patchDataClass(): string
    {
        return PassengerPatchData::class;
    }

    protected function applyDelete(string $id, string $userId): void
    {
        $passenger = Passenger::query()->whereKey($id)->first();

        if ($passenger === null) {
            return;
        }

        $this->assertVoyageAllowsManifestEdits($this->existingVoyageOrFail($passenger->voyage_id), $userId);
        $passenger->delete();
    }

    /**
     * @param  PassengerPutData  $dto
     */
    protected function applyPut(string $id, Data $dto, string $userId): void
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

        $existing = Passenger::query()->whereKey($id)->first();
        if ($existing !== null) {
            $this->assertVoyageAllowsManifestEdits($this->existingVoyageOrFail($existing->voyage_id), $userId);
        }

        $bookingId = $dto->booking_id instanceof Optional ? null : $dto->booking_id;
        $this->assertBookingBelongsToVoyageTrip($bookingId, $voyage);

        $checkInId = $dto->check_in_id instanceof Optional ? null : $dto->check_in_id;
        $this->assertCheckInBelongsToVoyage($checkInId, $voyage);

        Passenger::query()->updateOrCreate(
            ['id' => $id],
            [
                'voyage_id' => $voyageId,
                'name' => trim($name),
                'booking_id' => $bookingId,
                'check_in_id' => $checkInId,
                'notes' => $dto->notes instanceof Optional ? null : $dto->notes,
            ],
        );
    }

    /**
     * @param  PassengerPatchData  $patch
     */
    protected function applyPatch(string $id, Data $patch, string $userId): void
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
            $this->assertCheckInBelongsToVoyage($patch->check_in_id, $voyage);
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

    private function assertCheckInBelongsToVoyage(?string $checkInId, Voyage $voyage): void
    {
        if ($checkInId === null) {
            return;
        }

        if (CheckIn::query()->whereKey($checkInId)->where('voyage_id', $voyage->getKey())->doesntExist()) {
            throw ValidationException::withMessages([
                'check_in_id' => __('The check-in must belong to this departure.'),
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
