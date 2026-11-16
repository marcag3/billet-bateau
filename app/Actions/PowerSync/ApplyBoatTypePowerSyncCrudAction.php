<?php

namespace App\Actions\PowerSync;

use App\Actions\Media\TryDeleteStoredObjectAction;
use App\Data\PowerSync\BoatTypes\BoatTypePatchData;
use App\Data\PowerSync\BoatTypes\BoatTypePutData;
use App\Data\PowerSync\BoatTypes\BoatTypeResolvedPutData;
use App\Models\BoatType;
use Carbon\CarbonImmutable;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see BoatType} rows (boat_types upload type).
 *
 * @extends PowerSyncCrudAction<BoatTypePutData, BoatTypePatchData>
 */
final class ApplyBoatTypePowerSyncCrudAction extends PowerSyncCrudAction
{
    protected function tableName(): string
    {
        return 'boat_types';
    }

    protected function putDataClass(): string
    {
        return BoatTypePutData::class;
    }

    protected function patchDataClass(): string
    {
        return BoatTypePatchData::class;
    }

    protected function applyDelete(string $id, string $userId): void
    {
        $boatType = BoatType::query()->whereKey($id)->first();

        if ($boatType === null) {
            return;
        }

        $this->assertProgramManaged($boatType->program_id, $userId);

        $previousBannerKey = $boatType->banner_object_key;
        $boatType->delete();
        TryDeleteStoredObjectAction::run($previousBannerKey);
    }

    /**
     * @param  BoatTypePutData  $data
     */
    protected function applyPut(string $id, Data $data, string $userId): void
    {
        $this->assertProgramManaged($data->program_id, $userId);

        $existing = BoatType::query()->whereKey($id)->first();

        if ($existing !== null) {
            $this->assertProgramManaged($existing->program_id, $userId);
            $this->assertProgramUnchanged($existing->program_id, $data->program_id);
        }

        $previousBannerKey = $existing?->banner_object_key;

        $resolved = BoatTypeResolvedPutData::fromPut($data);

        BoatType::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $resolved->program_id,
                'name' => $resolved->name,
                'banner_object_key' => $resolved->banner_object_key,
                'banner_mime_type' => $resolved->banner_mime_type,
                'banner_size_bytes' => $resolved->banner_size_bytes,
                'banner_etag' => $resolved->banner_etag,
                'banner_uploaded_at' => $this->boatTypeBannerUploadedAt($resolved),
            ],
        );

        $newKey = BoatType::query()->whereKey($id)->value('banner_object_key');
        if ($this->shouldDeleteReplacedBannerObject($previousBannerKey, $newKey)) {
            TryDeleteStoredObjectAction::run($previousBannerKey);
        }
    }

    /**
     * @param  BoatTypePatchData  $data
     */
    protected function applyPatch(string $id, Data $data, string $userId): void
    {
        $boatType = BoatType::query()->whereKey($id)->first();

        if ($boatType === null) {
            return;
        }

        $this->assertProgramManaged($boatType->program_id, $userId);

        $previousBannerKey = $boatType->banner_object_key;

        if (! ($data->name instanceof Optional) && $data->name !== '') {
            $boatType->name = $data->name;
        }

        if (! ($data->banner_object_key instanceof Optional)) {
            $boatType->banner_object_key = $data->banner_object_key === '' ? null : $data->banner_object_key;
        }

        if (! ($data->banner_mime_type instanceof Optional)) {
            $boatType->banner_mime_type = $data->banner_mime_type;
        }

        if (! ($data->banner_size_bytes instanceof Optional)) {
            $boatType->banner_size_bytes = $data->banner_size_bytes;
        }

        if (! ($data->banner_etag instanceof Optional)) {
            $boatType->banner_etag = $data->banner_etag;
        }

        if (! ($data->banner_uploaded_at instanceof Optional)) {
            $boatType->banner_uploaded_at = $data->banner_uploaded_at !== null && $data->banner_uploaded_at !== ''
                ? CarbonImmutable::parse($data->banner_uploaded_at)
                : null;
        }

        if ($boatType->banner_object_key === null || $boatType->banner_object_key === '') {
            $boatType->banner_mime_type = null;
            $boatType->banner_size_bytes = null;
            $boatType->banner_etag = null;
            $boatType->banner_uploaded_at = null;
        }

        $boatType->save();

        $newKey = $boatType->banner_object_key;
        if ($this->shouldDeleteReplacedBannerObject($previousBannerKey, $newKey)) {
            TryDeleteStoredObjectAction::run($previousBannerKey);
        }
    }

    private function boatTypeBannerUploadedAt(BoatTypeResolvedPutData $resolved): ?CarbonImmutable
    {
        if ($resolved->banner_object_key === null || $resolved->banner_object_key === '') {
            return null;
        }

        if ($resolved->banner_uploaded_at === null || $resolved->banner_uploaded_at === '') {
            return null;
        }

        return CarbonImmutable::parse($resolved->banner_uploaded_at);
    }

    private function shouldDeleteReplacedBannerObject(?string $previousKey, ?string $newKey): bool
    {
        if ($previousKey === null || $previousKey === '') {
            return false;
        }

        return $previousKey !== $newKey;
    }
}
