<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\VoyageGuide\VoyageGuidePutData;
use App\Enums\VoyageStatus;
use App\Models\Guide;
use App\Models\Voyage;
use App\Support\Voyages\VoyageProgramResolver;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * @extends PowerSyncCrudAction<VoyageGuidePutData, Data>
 */
final class ApplyVoyageGuidePowerSyncCrudAction extends PowerSyncCrudAction
{
    protected function tableName(): string
    {
        return 'voyage_guide';
    }

    protected function putDataClass(): string
    {
        return VoyageGuidePutData::class;
    }

    protected function patchDataClass(): ?string
    {
        return null;
    }

    protected function applyDelete(string $id, string $userId): void
    {
        $row = DB::table('voyage_guide')->where('id', $id)->first();

        if ($row !== null) {
            VoyageProgramResolver::assertProgramManaged($this->existingVoyageOrFail((string) $row->voyage_id), $userId);
        }

        DB::table('voyage_guide')->where('id', $id)->delete();
    }

    /**
     * @param  VoyageGuidePutData  $dto
     */
    protected function applyPut(string $id, Data $dto, string $userId): void
    {
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

        if (Guide::query()->whereKey($guideId)->where('program_id', $voyage->program_id)->doesntExist()) {
            throw ValidationException::withMessages([
                'guide_id' => __('The selected guide is invalid.'),
            ]);
        }

        $existing = DB::table('voyage_guide')->where('id', $id)->first();

        if ($existing !== null) {
            VoyageProgramResolver::assertProgramManaged($this->existingVoyageOrFail((string) $existing->voyage_id), $userId);
        }

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
