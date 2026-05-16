<?php

namespace App\Data\PowerSync\Products;

use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Models\Product;
use Carbon\CarbonInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Optional;

/**
 * Merges PowerSync products PUT payloads with an optional existing row.
 *
 * @return array{
 *     program_id: string,
 *     name: string,
 *     description: ?string,
 *     capacity: int,
 *     boat_type_id: ?string,
 *     water_route_id: ?string,
 *     banner_object_key: ?string,
 *     banner_mime_type: ?string,
 *     banner_size_bytes: ?int,
 *     banner_etag: ?string,
 *     banner_uploaded_at: ?string
 * }
 */
final class ProductPutPayloadResolver
{
    /**
     * @return array{
     *     program_id: string,
     *     name: string,
     *     description: ?string,
     *     capacity: int,
     *     boat_type_id: ?string,
     *     water_route_id: ?string,
     *     banner_object_key: ?string,
     *     banner_mime_type: ?string,
     *     banner_size_bytes: ?int,
     *     banner_etag: ?string,
     *     banner_uploaded_at: ?string
     * }
     */
    public static function resolve(ProductPutData $dto, ?Product $existing): array
    {
        if ($existing !== null) {
            $programId = (string) $existing->program_id;
            if (! ($dto->program_id instanceof Optional) && $dto->program_id !== null && $dto->program_id !== $programId) {
                throw new AuthorizationException;
            }
        } else {
            if ($dto->program_id instanceof Optional || $dto->program_id === null || $dto->program_id === '') {
                throw ValidationException::withMessages([
                    'data.program_id' => 'Program is required.',
                ]);
            }

            $programId = $dto->program_id;
        }

        $name = PowerSyncOptional::resolve($dto->name, $existing?->name);
        if ($name === null || $name === '') {
            throw ValidationException::withMessages([
                'data.name' => 'Name is required.',
            ]);
        }

        $description = PowerSyncOptional::resolve($dto->description, $existing?->description);

        $capacity = PowerSyncOptional::resolve($dto->capacity, $existing?->capacity);
        $boatTypeId = PowerSyncOptional::resolve($dto->boat_type_id, $existing?->boat_type_id);
        $waterRouteId = PowerSyncOptional::resolve($dto->water_route_id, $existing?->water_route_id);

        $bannerKeyRaw = PowerSyncOptional::resolve($dto->banner_object_key, $existing?->banner_object_key);
        $bannerKey = is_string($bannerKeyRaw) && $bannerKeyRaw !== '' ? $bannerKeyRaw : null;

        if ($bannerKey === null) {
            return [
                'program_id' => $programId,
                'name' => (string) $name,
                'description' => $description,
                'capacity' => (int) $capacity,
                'boat_type_id' => $boatTypeId,
                'water_route_id' => $waterRouteId,
                'banner_object_key' => null,
                'banner_mime_type' => null,
                'banner_size_bytes' => null,
                'banner_etag' => null,
                'banner_uploaded_at' => null,
            ];
        }

        $bannerMime = PowerSyncOptional::resolve($dto->banner_mime_type, $existing?->banner_mime_type);
        $bannerSize = PowerSyncOptional::resolve($dto->banner_size_bytes, $existing?->banner_size_bytes);
        $bannerEtag = PowerSyncOptional::resolve($dto->banner_etag, $existing?->banner_etag);
        $existingUploaded = $existing?->banner_uploaded_at;
        $existingUploadedStr = $existingUploaded instanceof CarbonInterface
            ? $existingUploaded->toIso8601String()
            : null;
        $bannerUploadedAt = PowerSyncOptional::resolve($dto->banner_uploaded_at, $existingUploadedStr);

        return [
            'program_id' => $programId,
            'name' => (string) $name,
            'description' => $description,
            'capacity' => (int) $capacity,
            'boat_type_id' => $boatTypeId,
            'water_route_id' => $waterRouteId,
            'banner_object_key' => $bannerKey,
            'banner_mime_type' => is_string($bannerMime) ? $bannerMime : null,
            'banner_size_bytes' => is_int($bannerSize) ? $bannerSize : null,
            'banner_etag' => is_string($bannerEtag) ? $bannerEtag : null,
            'banner_uploaded_at' => is_string($bannerUploadedAt) ? $bannerUploadedAt : null,
        ];
    }
}
