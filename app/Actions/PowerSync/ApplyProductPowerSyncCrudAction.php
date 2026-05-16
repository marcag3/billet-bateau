<?php

namespace App\Actions\PowerSync;

use App\Actions\Media\TryDeleteStoredObjectAction;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\Products\ProductPatchData;
use App\Data\PowerSync\Products\ProductPutData;
use App\Data\PowerSync\Products\ProductPutPayloadResolver;
use App\Data\PowerSync\Products\ProductResolvedPutData;
use App\Models\BoatType;
use App\Models\Product;
use App\Models\Program;
use App\Models\WaterRoute;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see Product} rows (products upload type).
 */
final class ApplyProductPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $product = Product::query()->whereKey($id)->first();

            if ($product === null) {
                return;
            }

            $this->assertProgramManaged((string) $product->program_id, $userId);

            if ($product->trips()->exists()) {
                throw ValidationException::withMessages([
                    'id' => 'Cannot delete a product that is still used by trips.',
                ]);
            }

            $previousBannerKey = $product->banner_object_key;
            $product->delete();
            TryDeleteStoredObjectAction::run($previousBannerKey);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = ProductPutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $dto = ProductPatchData::validateAndCreate($raw);
            $this->applyPatch($id, $dto, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for products: '.$op);
    }

    private function applyPut(string $id, ProductPutData $dto, string $userId): void
    {
        $existing = Product::query()->whereKey($id)->first();

        $merged = ProductPutPayloadResolver::resolve($dto, $existing);
        $resolved = ProductResolvedPutData::validateAndCreate($merged);

        $this->assertProgramManaged($resolved->program_id, $userId);

        $this->assertBoatTypeBelongsToProgram($resolved->boat_type_id, $resolved->program_id);
        $this->assertWaterRouteBelongsToProgram($resolved->water_route_id, $resolved->program_id);

        $previousBannerKey = $existing?->banner_object_key;

        Product::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $resolved->program_id,
                'name' => $resolved->name,
                'description' => $resolved->description,
                'capacity' => $resolved->capacity,
                'boat_type_id' => $resolved->boat_type_id,
                'water_route_id' => $resolved->water_route_id,
                'banner_object_key' => $resolved->banner_object_key,
                'banner_mime_type' => $resolved->banner_mime_type,
                'banner_size_bytes' => $resolved->banner_size_bytes,
                'banner_etag' => $resolved->banner_etag,
                'banner_uploaded_at' => $this->productBannerUploadedAt($resolved),
            ],
        );

        $newKey = Product::query()->whereKey($id)->value('banner_object_key');
        if ($this->shouldDeleteReplacedBannerObject($previousBannerKey, $newKey)) {
            TryDeleteStoredObjectAction::run($previousBannerKey);
        }
    }

    private function applyPatch(string $id, ProductPatchData $patch, string $userId): void
    {
        $product = Product::query()->whereKey($id)->first();

        if ($product === null) {
            return;
        }

        $programId = (string) $product->program_id;
        $this->assertProgramManaged($programId, $userId);

        if (! ($patch->program_id instanceof Optional)) {
            $incoming = $patch->program_id;
            if ($incoming !== null && $incoming !== $programId) {
                throw new AuthorizationException;
            }
        }

        if (! ($patch->name instanceof Optional)) {
            if ($patch->name === null || $patch->name === '') {
                throw ValidationException::withMessages([
                    'data.name' => 'Name is required.',
                ]);
            }
            $product->name = $patch->name;
        }

        if (! ($patch->description instanceof Optional)) {
            $product->description = $patch->description;
        }

        if (! ($patch->capacity instanceof Optional)) {
            $product->capacity = (int) $patch->capacity;
        }

        if (! ($patch->boat_type_id instanceof Optional)) {
            $this->assertBoatTypeBelongsToProgram($patch->boat_type_id, $programId);
            $product->boat_type_id = $patch->boat_type_id;
        }

        if (! ($patch->water_route_id instanceof Optional)) {
            $this->assertWaterRouteBelongsToProgram($patch->water_route_id, $programId);
            $product->water_route_id = $patch->water_route_id;
        }

        $previousBannerKey = $product->banner_object_key;

        if (! ($patch->banner_object_key instanceof Optional)) {
            $product->banner_object_key = $patch->banner_object_key === '' ? null : $patch->banner_object_key;
        }

        if (! ($patch->banner_mime_type instanceof Optional)) {
            $product->banner_mime_type = $patch->banner_mime_type;
        }

        if (! ($patch->banner_size_bytes instanceof Optional)) {
            $product->banner_size_bytes = $patch->banner_size_bytes;
        }

        if (! ($patch->banner_etag instanceof Optional)) {
            $product->banner_etag = $patch->banner_etag;
        }

        if (! ($patch->banner_uploaded_at instanceof Optional)) {
            $product->banner_uploaded_at = $patch->banner_uploaded_at !== null && $patch->banner_uploaded_at !== ''
                ? CarbonImmutable::parse($patch->banner_uploaded_at)
                : null;
        }

        if ($product->banner_object_key === null || $product->banner_object_key === '') {
            $product->banner_mime_type = null;
            $product->banner_size_bytes = null;
            $product->banner_etag = null;
            $product->banner_uploaded_at = null;
        }

        $product->save();

        $newKey = $product->banner_object_key;
        if ($this->shouldDeleteReplacedBannerObject($previousBannerKey, $newKey)) {
            TryDeleteStoredObjectAction::run($previousBannerKey);
        }
    }

    private function assertProgramManaged(string $programId, string $userId): void
    {
        $program = Program::query()->whereKey($programId)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }
    }

    private function assertBoatTypeBelongsToProgram(?string $boatTypeId, string $programId): void
    {
        if ($boatTypeId === null) {
            return;
        }

        $boatType = BoatType::query()->whereKey($boatTypeId)->first();

        if ($boatType === null || (string) $boatType->program_id !== $programId) {
            throw ValidationException::withMessages([
                'data.boat_type_id' => 'Boat type must belong to the same program.',
            ]);
        }
    }

    private function assertWaterRouteBelongsToProgram(?string $waterRouteId, string $programId): void
    {
        if ($waterRouteId === null) {
            return;
        }

        $route = WaterRoute::query()->whereKey($waterRouteId)->first();

        if ($route === null || (string) $route->program_id !== $programId) {
            throw ValidationException::withMessages([
                'data.water_route_id' => 'Water route must belong to the same program.',
            ]);
        }
    }

    private function productBannerUploadedAt(ProductResolvedPutData $resolved): ?CarbonImmutable
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
