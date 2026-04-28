<?php

namespace App\Data\PowerSync\TemplateDaySlots;

use App\Data\PowerSync\Support\PowerSyncCrudInnerDataValidator;
use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Models\TemplateDaySlot;

/**
 * @return array{sort_order: int, departure_time: string, capacity: int, boat_type_id: ?string, water_route_id: ?string}
 */
final class TemplateDaySlotPutPayloadResolver
{
    public static function resolve(TemplateDaySlotPutData $dto, ?TemplateDaySlot $existing): array
    {
        $sortOrder = PowerSyncOptional::resolve($dto->sort_order, $existing?->sort_order);
        $departureTime = PowerSyncOptional::resolve($dto->departure_time, $existing?->departure_time);
        $capacity = PowerSyncOptional::resolve($dto->capacity, $existing?->capacity);
        $boatTypeId = PowerSyncOptional::resolve($dto->boat_type_id, $existing?->boat_type_id);
        $waterRouteId = PowerSyncOptional::resolve($dto->water_route_id, $existing?->water_route_id);

        PowerSyncCrudInnerDataValidator::validate(
            [
                'sort_order' => $sortOrder,
                'departure_time' => $departureTime,
                'capacity' => $capacity,
            ],
            [
                'sort_order' => ['required', 'integer', 'min:0'],
                'departure_time' => ['required', 'string', 'regex:/^([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/'],
                'capacity' => ['required', 'integer', 'min:1'],
            ],
        );

        return [
            'sort_order' => (int) $sortOrder,
            'departure_time' => (string) $departureTime,
            'capacity' => (int) $capacity,
            'boat_type_id' => $boatTypeId,
            'water_route_id' => $waterRouteId,
        ];
    }
}
