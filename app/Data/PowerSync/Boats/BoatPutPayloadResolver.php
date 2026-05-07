<?php

namespace App\Data\PowerSync\Boats;

use App\Data\PowerSync\Support\PowerSyncDisplayName;
use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Models\Boat;

/**
 * Resolves merged PUT attributes for {@see Boat} PowerSync uploads.
 *
 * @return array{name: string, notes: ?string, capacity: int|null, boat_type_id: ?string, program_id: string|null}
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
        $programId = PowerSyncOptional::resolve($dto->program_id, $existing?->program_id);

        $name = PowerSyncDisplayName::resolve($nameMerged, $existingName);

        return [
            'name' => $name,
            'notes' => $notes,
            'capacity' => $capacity,
            'boat_type_id' => $boatTypeId,
            'program_id' => $programId,
        ];
    }
}
