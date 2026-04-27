<?php

namespace App\Data\PowerSync\Support;

/**
 * Resolves display names for PowerSync entities that default to {@code Untitled}.
 */
final class PowerSyncDisplayName
{
    public static function resolve(string $mergedTrimmed, ?string $existingName): string
    {
        if ($mergedTrimmed !== '') {
            return $mergedTrimmed;
        }

        if ($existingName !== null && trim((string) $existingName) !== '') {
            return trim((string) $existingName);
        }

        return 'Untitled';
    }
}
