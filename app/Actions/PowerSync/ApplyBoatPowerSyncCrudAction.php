<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\Boats\BoatPatchData;
use App\Data\PowerSync\Boats\BoatPutData;
use App\Data\PowerSync\Boats\BoatPutPayloadResolver;
use App\Data\PowerSync\Boats\BoatResolvedPutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Models\Boat;
use Illuminate\Auth\Access\AuthorizationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see Boat} rows (boats upload type).
 */
final class ApplyBoatPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $boat = Boat::query()->whereKey($id)->first();

            if ($boat === null) {
                return;
            }

            $this->ensureUserMayMutateBoat($boat, $userId);

            $boat->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = BoatPutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $dto = BoatPatchData::validateAndCreate($raw);
            $this->applyPatch($id, $dto, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for boats: '.$op);
    }

    private function applyPut(string $id, BoatPutData $data, string $userId): void
    {
        $existing = Boat::query()->whereKey($id)->first();

        if ($existing !== null) {
            $this->ensureUserMayMutateBoat($existing, $userId);
        }

        $merged = BoatPutPayloadResolver::resolve($data, $existing);
        $resolved = BoatResolvedPutData::validateAndCreate($merged);

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

    private function applyPatch(string $id, BoatPatchData $data, string $userId): void
    {
        $boat = Boat::query()->whereKey($id)->first();

        if ($boat === null) {
            return;
        }

        $this->ensureUserMayMutateBoat($boat, $userId);

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

        if (! ($data->boat_type_id instanceof Optional)) {
            $boat->boat_type_id = $data->boat_type_id;
        }

        if (! ($data->program_id instanceof Optional)) {
            $boat->program_id = $data->program_id;
        }

        $boat->save();
    }

    private function ensureUserMayMutateBoat(Boat $boat, string $userId): void
    {
        $program = $boat->program()->first();

        if ($program !== null && $program->userCanManage($userId)) {
            return;
        }

        throw new AuthorizationException;
    }
}
