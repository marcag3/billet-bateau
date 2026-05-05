<?php

namespace App\Data\PowerSync\Support;

/**
 * Removes client-supplied timestamp columns from PowerSync CRUD inner payloads.
 *
 * Laravel continues to manage {@code created_at} / {@code updated_at} server-side.
 */
final class PowerSyncClientTimestampGuard
{
    // TODO: dto should validate schema and just ignore timestamps. this should not be needed
    /**
     * @param  array<string, mixed>|null  $data  Inner {@code crud[].data} for PUT/PATCH.
     * @return array<string, mixed>|null
     */
    public static function stripClientTimestamps(?array $data): ?array
    {
        if ($data === null) {
            return null;
        }

        return array_diff_key($data, array_flip(['created_at', 'updated_at']));
    }
}
