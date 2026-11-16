<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\VoyageBoat\VoyageBoatPutData;
use App\Enums\VoyageStatus;
use App\Models\Boat;
use App\Models\Voyage;
use App\Support\Voyages\VoyageProgramResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * @extends PowerSyncCrudAction<VoyageBoatPutData, Data>
 */
final class ApplyVoyageBoatPowerSyncCrudAction extends PowerSyncCrudAction
{
    protected function tableName(): string
    {
        return 'voyage_boat';
    }

    protected function putDataClass(): string
    {
        return VoyageBoatPutData::class;
    }

    protected function patchDataClass(): ?string
    {
        return null;
    }

    protected function applyDelete(string $id, string $userId): void
    {
        $row = DB::table('voyage_boat')->where('id', $id)->first();

        if ($row === null) {
            return;
        }

        $voyage = Voyage::query()->whereKey($row->voyage_id)->first();

        if ($voyage !== null) {
            VoyageProgramResolver::assertProgramManaged($voyage, $userId);
        }

        DB::table('voyage_boat')->where('id', $id)->delete();
    }

    /**
     * @param  VoyageBoatPutData  $dto
     */
    protected function applyPut(string $id, Data $dto, string $userId): void
    {
        $voyageId = $dto->voyage_id instanceof Optional ? null : $dto->voyage_id;
        $boatId = $dto->boat_id instanceof Optional ? null : $dto->boat_id;

        if ($voyageId === null || $boatId === null) {
            throw ValidationException::withMessages([
                'data' => __('Voyage boat assignment requires voyage and boat.'),
            ]);
        }

        $voyage = Voyage::query()->whereKey($voyageId)->first();

        if ($voyage === null) {
            throw ValidationException::withMessages([
                'voyage_id' => __('The selected departure is invalid.'),
            ]);
        }

        VoyageProgramResolver::assertProgramManaged($voyage, $userId);

        if ($voyage->status === VoyageStatus::Completed) {
            throw ValidationException::withMessages([
                'voyage' => __('Boat assignments cannot change after arrival.'),
            ]);
        }

        $boat = Boat::query()->whereKey($boatId)->first();

        if ($boat === null) {
            throw ValidationException::withMessages([
                'boat_id' => __('The selected boat is invalid.'),
            ]);
        }

        if ((string) $boat->program_id !== (string) $voyage->program_id) {
            throw ValidationException::withMessages([
                'boat_id' => __('The boat must belong to the same program as the departure.'),
            ]);
        }

        $existing = DB::table('voyage_boat')->where('id', $id)->first();

        if ($existing === null) {
            DB::table('voyage_boat')->insert([
                'id' => $id,
                'voyage_id' => $voyageId,
                'boat_id' => $boatId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('voyage_boat')->where('id', $id)->update([
                'voyage_id' => $voyageId,
                'boat_id' => $boatId,
                'updated_at' => now(),
            ]);
        }
    }
}
