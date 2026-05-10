<?php

namespace App\Data\PowerSync\Programs;

use App\Data\PowerSync\Support\PowerSyncDisplayName;
use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Data\PowerSync\Values\SlugNormalizer;
use App\Models\Program;
use Spatie\LaravelData\Optional;

/**
 * Resolves merged PUT scalar attributes for {@see Program} PowerSync uploads (before slug uniqueness checks).
 */
final class ProgramPutPayloadResolver
{
    /**
     * @return array{
     *     name: string,
     *     description: ?string,
     *     theme_color: string,
     *     is_active: bool,
     *     is_archived: bool,
     *     base_slug: string,
     *     line_1: ?string,
     *     line_2: ?string,
     *     city: ?string,
     *     postal_code: ?string,
     *     country: ?string,
     *     banner_object_key: ?string,
     *     banner_mime_type: ?string,
     *     banner_size_bytes: ?int,
     *     banner_etag: ?string,
     *     banner_uploaded_at: ?string
     * }
     */
    public static function resolve(ProgramPutData $dto, ?Program $existing): array
    {
        $existingName = $existing !== null ? (string) $existing->name : null;

        $nameMerged = PowerSyncOptional::resolve($dto->name, $existingName, '');
        $nameMerged = is_string($nameMerged) ? $nameMerged : '';

        $description = PowerSyncOptional::resolve($dto->description, $existing?->description);

        if ($dto->theme_color instanceof Optional) {
            $themeColor = $existing !== null
                ? strtoupper((string) $existing->theme_color)
                : '#000000';
        } else {
            $themeColor = $dto->theme_color === null
                ? '#000000'
                : (string) $dto->theme_color;
        }

        $isActive = (bool) PowerSyncOptional::resolve($dto->is_active, $existing?->is_active ?? false, false);
        $isArchived = (bool) PowerSyncOptional::resolve($dto->is_archived, $existing?->is_archived ?? false, false);

        $displayName = PowerSyncDisplayName::resolve($nameMerged, $existingName);

        $slugFromDto = $dto->slug instanceof Optional ? null : $dto->slug;
        $proposedSlug = SlugNormalizer::normalize($slugFromDto);
        if ($proposedSlug === null || $proposedSlug === '') {
            $proposedSlug = SlugNormalizer::normalize($displayName);
        }

        $baseSlug = $proposedSlug !== null && $proposedSlug !== '' ? $proposedSlug : 'program';

        $line1 = PowerSyncOptional::resolve($dto->line_1, $existing?->line_1);
        $line2 = PowerSyncOptional::resolve($dto->line_2, $existing?->line_2);
        $city = PowerSyncOptional::resolve($dto->city, $existing?->city);
        $postalCode = PowerSyncOptional::resolve($dto->postal_code, $existing?->postal_code);
        $country = PowerSyncOptional::resolve($dto->country, $existing?->country);

        $bannerObjectKeyRaw = PowerSyncOptional::resolve($dto->banner_object_key, $existing?->banner_object_key);
        $bannerObjectKey = is_string($bannerObjectKeyRaw) && $bannerObjectKeyRaw !== ''
            ? $bannerObjectKeyRaw
            : null;

        if ($bannerObjectKey === null) {
            return [
                'name' => $displayName,
                'description' => $description,
                'theme_color' => $themeColor,
                'is_active' => $isActive,
                'is_archived' => $isArchived,
                'base_slug' => $baseSlug,
                'line_1' => $line1,
                'line_2' => $line2,
                'city' => $city,
                'postal_code' => $postalCode,
                'country' => $country,
                'banner_object_key' => null,
                'banner_mime_type' => null,
                'banner_size_bytes' => null,
                'banner_etag' => null,
                'banner_uploaded_at' => null,
            ];
        }

        $existingUploadedAt = $existing?->banner_uploaded_at !== null
            ? $existing->banner_uploaded_at->toIso8601String()
            : null;

        $bannerMimeType = PowerSyncOptional::resolve($dto->banner_mime_type, $existing?->banner_mime_type);
        $bannerSizeBytes = PowerSyncOptional::resolve($dto->banner_size_bytes, $existing?->banner_size_bytes);
        $bannerEtag = PowerSyncOptional::resolve($dto->banner_etag, $existing?->banner_etag);
        $bannerUploadedAt = PowerSyncOptional::resolve($dto->banner_uploaded_at, $existingUploadedAt);

        return [
            'name' => $displayName,
            'description' => $description,
            'theme_color' => $themeColor,
            'is_active' => $isActive,
            'is_archived' => $isArchived,
            'base_slug' => $baseSlug,
            'line_1' => $line1,
            'line_2' => $line2,
            'city' => $city,
            'postal_code' => $postalCode,
            'country' => $country,
            'banner_object_key' => $bannerObjectKey,
            'banner_mime_type' => is_string($bannerMimeType) ? $bannerMimeType : null,
            'banner_size_bytes' => is_int($bannerSizeBytes) ? $bannerSizeBytes : null,
            'banner_etag' => is_string($bannerEtag) ? $bannerEtag : null,
            'banner_uploaded_at' => is_string($bannerUploadedAt) ? $bannerUploadedAt : null,
        ];
    }
}
