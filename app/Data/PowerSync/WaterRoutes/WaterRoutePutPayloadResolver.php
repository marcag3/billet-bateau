<?php

namespace App\Data\PowerSync\WaterRoutes;

use App\Data\PowerSync\Support\PowerSyncDisplayName;
use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Models\WaterRoute;
use Clickbar\Magellan\Data\Geometries\LineString;
use Illuminate\Validation\ValidationException;

/**
 * Resolves merged PUT attributes for {@see WaterRoute} PowerSync uploads (after program id is known).
 *
 * @return array{name: string, duration_minutes: int, trace: LineString}
 */
final class WaterRoutePutPayloadResolver
{
    public static function resolve(WaterRoutePutData $dto, ?WaterRoute $existing): array
    {
        $existingName = $existing !== null ? (string) $existing->name : null;

        $nameMerged = PowerSyncOptional::resolve($dto->name, $existingName, '');
        $nameMerged = is_string($nameMerged) ? $nameMerged : '';

        $durationMinutes = PowerSyncOptional::resolve($dto->duration_minutes, $existing?->duration_minutes);
        $trace = PowerSyncOptional::resolve($dto->trace, $existing?->trace);

        if (! $trace instanceof LineString) {
            throw ValidationException::withMessages([
                'data.trace' => 'Trace geometry is required.',
            ]);
        }

        $name = PowerSyncDisplayName::resolve($nameMerged, $existingName);

        return [
            'name' => $name,
            'duration_minutes' => (int) $durationMinutes,
            'trace' => $trace,
        ];
    }
}
