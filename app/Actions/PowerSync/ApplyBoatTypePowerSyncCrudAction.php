<?php

namespace App\Actions\PowerSync;

use App\Actions\Media\TryDeleteStoredObjectAction;
use App\Data\PowerSync\BoatTypes\BoatTypePatchData;
use App\Data\PowerSync\BoatTypes\BoatTypePutData;
use App\Data\PowerSync\BoatTypes\BoatTypeResolvedPutData;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Models\BoatType;
use App\Models\Program;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see BoatType} rows (boat_types upload type).
 */
final class ApplyBoatTypePowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $boatType = BoatType::query()->whereKey($id)->first();

            if ($boatType === null) {
                return;
            }

            $program = Program::query()->whereKey($boatType->program_id)->first();

            if ($program === null || ! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }

            $previousBannerKey = $boatType->banner_object_key;
            $boatType->delete();
            TryDeleteStoredObjectAction::run($previousBannerKey);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $data = BoatTypePutData::validateAndCreate($raw);
            $program = Program::query()->whereKey($data->program_id)->first();

            if ($program === null || ! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }

            $existing = BoatType::query()->whereKey($id)->first();
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

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $data = BoatTypePatchData::validateAndCreate($raw);
            $boatType = BoatType::query()->whereKey($id)->first();

            if ($boatType === null) {
                return;
            }

            $program = Program::query()->whereKey($boatType->program_id)->first();

            if ($program === null || ! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }

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

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for boat_types: '.$op);
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
