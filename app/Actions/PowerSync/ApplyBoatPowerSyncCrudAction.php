<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\Boats\BoatPatchData;
use App\Data\PowerSync\Boats\BoatPutData;
use App\Data\PowerSync\Boats\BoatPutPayloadResolver;
use App\Data\PowerSync\Boats\BoatResolvedPutData;
use App\Models\Boat;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see Boat} rows (boats upload type).
 *
 * @extends PowerSyncCrudAction<BoatPutData, BoatPatchData>
 */
final class ApplyBoatPowerSyncCrudAction extends PowerSyncCrudAction
{
    protected function tableName(): string
    {
        return 'boats';
    }

    protected function putDataClass(): string
    {
        return BoatPutData::class;
    }

    protected function patchDataClass(): string
    {
        return BoatPatchData::class;
    }

    protected function applyDelete(string $id, string $userId): void
    {
        $boat = Boat::query()->whereKey($id)->first();

        if ($boat === null) {
            return;
        }

        $this->assertProgramManaged($boat->program_id, $userId);

        $boat->delete();
    }

    /**
     * @param  BoatPutData  $data
     */
    protected function applyPut(string $id, Data $data, string $userId): void
    {
        $existing = Boat::query()->whereKey($id)->first();

        if ($existing !== null) {
            $this->assertProgramManaged($existing->program_id, $userId);
        }

        $merged = BoatPutPayloadResolver::resolve($data, $existing);
        $resolved = BoatResolvedPutData::validateAndCreate($merged);

        if ($existing !== null) {
            $this->assertProgramUnchanged($existing->program_id, $resolved->program_id);
        }

        $this->assertProgramManaged($resolved->program_id, $userId);
        $this->assertBoatTypeBelongsToProgram($resolved->boat_type_id, $resolved->program_id);

        Boat::query()->updateOrCreate(
            ['id' => $id],
            [
                'name' => $resolved->name,
                'capacity' => $resolved->capacity,
                'notes' => $resolved->notes,
                'boat_type_id' => $resolved->boat_type_id,
                'program_id' => $resolved->program_id,
            ],
        );
    }

    /**
     * @param  BoatPatchData  $data
     */
    protected function applyPatch(string $id, Data $data, string $userId): void
    {
        $boat = Boat::query()->whereKey($id)->first();

        if ($boat === null) {
            return;
        }

        $this->assertProgramManaged($boat->program_id, $userId);

        if (! ($data->name instanceof Optional)) {
            if ($data->name !== null && $data->name !== '') {
                $boat->name = $data->name;
            }
        }

        if (! ($data->notes instanceof Optional)) {
            $boat->notes = $data->notes;
        }

        if (! ($data->capacity instanceof Optional)) {
            $boat->capacity = $data->capacity;
        }

        if (! ($data->program_id instanceof Optional)) {
            $this->assertProgramUnchanged($boat->program_id, $data->program_id);
        }

        if (! ($data->boat_type_id instanceof Optional)) {
            $this->assertBoatTypeBelongsToProgram($data->boat_type_id, (string) $boat->program_id);
            $boat->boat_type_id = $data->boat_type_id;
        }

        $boat->save();
    }
}
