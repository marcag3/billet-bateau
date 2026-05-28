<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\VoyageGuide\VoyageGuidePutData;
use App\Enums\VoyageStatus;
use App\Models\Guide;
use App\Models\Voyage;
use App\Support\Voyages\VoyageProgramResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

final class ApplyVoyageGuidePowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $row = DB::table('voyage_guide')->where('id', $id)->first();

            if ($row !== null) {
                $voyage = Voyage::query()->whereKey($row->voyage_id)->first();

                if ($voyage !== null) {
                    VoyageProgramResolver::assertProgramManaged($voyage, $userId);
                }
            }

            DB::table('voyage_guide')->where('id', $id)->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            throw new \RuntimeException('PATCH is not supported for voyage_guide.');
        }

        if ($op !== PowerSyncCrudEntryData::OP_PUT) {
            throw new \RuntimeException('Unsupported PowerSync CRUD op for voyage_guide: '.$op);
        }

        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];
        $dto = VoyageGuidePutData::validateAndCreate($raw);

        $voyageId = $dto->voyage_id instanceof Optional ? null : $dto->voyage_id;
        $guideId = $dto->guide_id instanceof Optional ? null : $dto->guide_id;

        if ($voyageId === null || $guideId === null) {
            throw ValidationException::withMessages([
                'data' => __('Voyage guide assignment requires voyage and guide.'),
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
                'voyage' => __('Guide assignments cannot change after arrival.'),
            ]);
        }

        if (Guide::query()->whereKey($guideId)->doesntExist()) {
            throw ValidationException::withMessages([
                'guide_id' => __('The selected guide is invalid.'),
            ]);
        }

        $existing = DB::table('voyage_guide')->where('id', $id)->first();

        if ($existing === null) {
            DB::table('voyage_guide')->insert([
                'id' => $id,
                'voyage_id' => $voyageId,
                'guide_id' => $guideId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('voyage_guide')->where('id', $id)->update([
                'voyage_id' => $voyageId,
                'guide_id' => $guideId,
                'updated_at' => now(),
            ]);
        }
    }
}
