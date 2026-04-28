<?php

namespace App\Data\PowerSync\Trips;

use App\Data\PowerSync\Support\PowerSyncCrudInnerDataValidator;
use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Models\Trip;
use Carbon\CarbonImmutable;

/**
 * Resolves merged PUT attributes for {@see Trip} PowerSync uploads (after program id is known).
 *
 * @return array{scheduled_departure_at: CarbonImmutable, capacity: int, boat_type_id: ?string, water_route_id: ?string, template_day_slot_id: ?string}
 */
final class TripPutPayloadResolver
{
    public static function resolve(TripPutData $dto, ?Trip $existing): array
    {
        $existingScheduled = null;
        if ($existing?->scheduled_departure_at !== null) {
            $existingScheduled = CarbonImmutable::parse((string) $existing->scheduled_departure_at);
        }

        $scheduledAt = PowerSyncOptional::resolve($dto->scheduled_departure_at, $existingScheduled);
        $capacity = PowerSyncOptional::resolve($dto->capacity, $existing?->capacity);
        $boatTypeId = PowerSyncOptional::resolve($dto->boat_type_id, $existing?->boat_type_id);
        $waterRouteId = PowerSyncOptional::resolve($dto->water_route_id, $existing?->water_route_id);
        $templateDaySlotId = PowerSyncOptional::resolve($dto->template_day_slot_id, $existing?->template_day_slot_id);

        PowerSyncCrudInnerDataValidator::validate(
            [
                'scheduled_departure_at' => $scheduledAt,
                'capacity' => $capacity,
            ],
            [
                'scheduled_departure_at' => ['required', 'date'],
                'capacity' => ['required', 'integer', 'min:1'],
            ],
        );

        $scheduledImmutable = $scheduledAt instanceof CarbonImmutable
            ? $scheduledAt
            : CarbonImmutable::parse((string) $scheduledAt);

        return [
            'scheduled_departure_at' => $scheduledImmutable,
            'capacity' => (int) $capacity,
            'boat_type_id' => $boatTypeId,
            'water_route_id' => $waterRouteId,
            'template_day_slot_id' => $templateDaySlotId,
        ];
    }
}
