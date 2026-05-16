<?php

namespace App\Data\PowerSync\Trips;

use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Models\Trip;
use Carbon\CarbonImmutable;

/**
 * Resolves merged PUT attributes for {@see Trip} PowerSync uploads (after program id is known).
 *
 * @return array{scheduled_departure_at: CarbonImmutable, product_id: string}
 */
final class TripPutPayloadResolver
{
    /**
     * @return array{scheduled_departure_at: CarbonImmutable, product_id: string}
     */
    public static function resolve(TripPutData $dto, ?Trip $existing): array
    {
        $existingScheduled = null;
        if ($existing?->scheduled_departure_at !== null) {
            $existingScheduled = CarbonImmutable::parse((string) $existing->scheduled_departure_at);
        }

        $scheduledAt = PowerSyncOptional::resolve($dto->scheduled_departure_at, $existingScheduled);
        $productId = PowerSyncOptional::resolve($dto->product_id, $existing?->product_id);

        $scheduledImmutable = $scheduledAt instanceof CarbonImmutable
            ? $scheduledAt
            : CarbonImmutable::parse((string) $scheduledAt);

        return [
            'scheduled_departure_at' => $scheduledImmutable,
            'product_id' => (string) $productId,
        ];
    }
}
