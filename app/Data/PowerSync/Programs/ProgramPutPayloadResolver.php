<?php

namespace App\Data\PowerSync\Programs;

use App\Data\PowerSync\Support\PowerSyncDisplayName;
use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Data\PowerSync\Values\SlugNormalizer;
use App\Models\Program;
use Spatie\LaravelData\Optional;

/**
 * Resolves merged PUT scalar attributes for {@see Program} PowerSync uploads (before slug uniqueness and address ownership checks).
 */
final class ProgramPutPayloadResolver
{
    /**
     * @return array{name: string, description: ?string, theme_color: string, is_active: bool, is_archived: bool, base_slug: string, address_id: mixed}
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

        return [
            'name' => $displayName,
            'description' => $description,
            'theme_color' => $themeColor,
            'is_active' => $isActive,
            'is_archived' => $isArchived,
            'base_slug' => $baseSlug,
            'address_id' => $dto->address_id,
        ];
    }
}
