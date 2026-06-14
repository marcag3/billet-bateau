<?php

namespace App\Data\PowerSync\Voyages;

use App\Enums\VoyageStatus;
use App\Models\Voyage;
use Spatie\LaravelData\Optional;

final class VoyagePutPayloadResolver
{
    /**
     * @return array<string, mixed>
     */
    public static function resolve(VoyagePutData $dto, ?Voyage $existing): array
    {
        $programId = $dto->program_id instanceof Optional
            ? ($existing?->program_id !== null ? (string) $existing->program_id : null)
            : $dto->program_id;

        $tripId = $dto->trip_id instanceof Optional
            ? ($existing?->trip_id !== null ? (string) $existing->trip_id : null)
            : $dto->trip_id;

        $waterRouteId = $dto->water_route_id instanceof Optional
            ? (string) ($existing?->water_route_id ?? '')
            : (string) ($dto->water_route_id ?? '');

        $scheduledDeparture = $dto->scheduled_departure_at instanceof Optional
            ? $existing?->scheduled_departure_at
            : $dto->scheduled_departure_at;

        $status = $dto->status instanceof Optional
            ? ($existing !== null ? $existing->status->value : VoyageStatus::Draft->value)
            : (string) ($dto->status ?? VoyageStatus::Draft->value);

        return [
            'program_id' => $programId,
            'trip_id' => $tripId,
            'water_route_id' => $waterRouteId,
            'scheduled_departure_at' => $scheduledDeparture,
            'status' => $status,
        ];
    }
}
