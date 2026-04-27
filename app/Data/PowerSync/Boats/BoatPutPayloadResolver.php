<?php

namespace App\Data\PowerSync\Boats;

use App\Data\PowerSync\Support\PowerSyncCrudInnerDataValidator;
use App\Data\PowerSync\Support\PowerSyncDisplayName;
use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Models\Boat;

/**
 * Resolves merged PUT attributes for {@see Boat} PowerSync uploads.
 *
 * @return array{name: string, notes: ?string, capacity: int, boat_type_id: ?string}
 */
final class BoatPutPayloadResolver
{
    public static function resolve(BoatPutData $dto, ?Boat $existing): array
    {
        $existingName = $existing !== null ? (string) $existing->name : null;

        $nameMerged = PowerSyncOptional::resolve($dto->name, $existingName, '');
        $nameMerged = is_string($nameMerged) ? $nameMerged : '';

        $notes = PowerSyncOptional::resolve($dto->notes, $existing?->notes);
        $capacity = PowerSyncOptional::resolve($dto->capacity, $existing?->capacity);
        $boatTypeId = PowerSyncOptional::resolve($dto->boat_type_id, $existing?->boat_type_id);

        PowerSyncCrudInnerDataValidator::validate(
            ['capacity' => $capacity],
            ['capacity' => ['required', 'integer', 'min:0']],
        );

        $name = PowerSyncDisplayName::resolve($nameMerged, $existingName);

        return [
            'name' => $name,
            'notes' => $notes,
            'capacity' => (int) $capacity,
            'boat_type_id' => $boatTypeId,
        ];
    }
}
