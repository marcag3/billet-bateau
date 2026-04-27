<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\BoatTypes\BoatTypePatchData;
use App\Data\PowerSync\BoatTypes\BoatTypePutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Models\BoatType;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see BoatType} rows (boat_types upload type).
 */
final class ApplyBoatTypePowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, int $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $boatType = BoatType::query()->whereKey($id)->first();
            $boatType?->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $data = BoatTypePutData::validateAndCreate($raw);
            $name = $data->name;

            BoatType::query()->updateOrCreate(
                ['id' => $id],
                [
                    'user_id' => $userId,
                    'name' => ($name !== null && $name !== '') ? $name : 'Untitled',
                ],
            );

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $data = BoatTypePatchData::validateAndCreate($raw);
            $boatType = BoatType::query()->whereKey($id)->first();

            if ($boatType === null) {
                return;
            }

            if (! ($data->name instanceof Optional) && $data->name !== '') {
                $boatType->name = $data->name;
            }

            $boatType->save();

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for boat_types: '.$op);
    }
}
