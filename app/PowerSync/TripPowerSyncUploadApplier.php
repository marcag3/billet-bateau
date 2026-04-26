<?php

namespace App\PowerSync;

use App\Models\BoatType;
use App\Models\Program;
use App\Models\Trip;
use App\Models\WaterRoute;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class TripPowerSyncUploadApplier
{
    /**
     * @param  array{op: string, type: string, id: string, data?: array<string, mixed>|null}  $entry
     */
    public function apply(array $entry, int $userId): void
    {
        $id = $entry['id'];
        $op = $entry['op'];
        /** @var array<string, mixed> $data */
        $data = $entry['data'] ?? [];

        if ($op === 'DELETE') {
            $trip = Trip::query()->whereKey($id)->first();

            if ($trip === null) {
                return;
            }

            $program = Program::query()->whereKey($trip->program_id)->first();

            if ($program === null || ! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }

            $trip->delete();

            return;
        }

        if ($op === 'PUT') {
            $this->applyPut($id, $data, $userId);

            return;
        }

        if ($op === 'PATCH') {
            $this->applyPatch($id, $data, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for trips: '.$op);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function applyPut(string $id, array $data, int $userId): void
    {
        $existing = Trip::query()->whereKey($id)->first();

        $programIdFromData = $this->readUuid($data['program_id'] ?? null);

        if ($existing !== null) {
            $programId = (string) $existing->program_id;
            if ($programIdFromData !== null && $programIdFromData !== $programId) {
                throw new AuthorizationException;
            }
        } else {
            $programId = $programIdFromData;
            if ($programId === null) {
                throw ValidationException::withMessages([
                    'data.program_id' => 'Program is required.',
                ]);
            }
        }

        $program = Program::query()->whereKey($programId)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

        $scheduledAt = array_key_exists('scheduled_departure_at', $data)
            ? $this->readDateTime($data['scheduled_departure_at'])
            : ($existing?->scheduled_departure_at !== null ? CarbonImmutable::parse($existing->scheduled_departure_at) : null);

        if ($scheduledAt === null) {
            throw ValidationException::withMessages([
                'data.scheduled_departure_at' => 'Scheduled departure is required.',
            ]);
        }

        $capacity = array_key_exists('capacity', $data)
            ? $this->readCapacity($data['capacity'], $existing)
            : $existing?->capacity;

        if ($capacity === null) {
            throw ValidationException::withMessages([
                'data.capacity' => 'Trip capacity is required.',
            ]);
        }

        $boatTypeId = array_key_exists('boat_type_id', $data)
            ? $this->resolveOptionalFkUuid($data['boat_type_id'], BoatType::class)
            : $existing?->boat_type_id;

        $waterRouteId = array_key_exists('water_route_id', $data)
            ? $this->resolveOptionalFkUuid($data['water_route_id'], WaterRoute::class)
            : $existing?->water_route_id;

        Trip::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $programId,
                'boat_type_id' => $boatTypeId,
                'water_route_id' => $waterRouteId,
                'scheduled_departure_at' => $scheduledAt,
                'capacity' => $capacity,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function applyPatch(string $id, array $data, int $userId): void
    {
        $trip = Trip::query()->whereKey($id)->first();

        if ($trip === null) {
            return;
        }

        $program = Program::query()->whereKey($trip->program_id)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

        if (array_key_exists('program_id', $data)) {
            $incoming = $this->readUuid($data['program_id']);
            if ($incoming !== null && $incoming !== (string) $trip->program_id) {
                throw new AuthorizationException;
            }
        }

        if (array_key_exists('scheduled_departure_at', $data)) {
            $parsed = $this->readDateTime($data['scheduled_departure_at']);
            if ($parsed === null) {
                throw ValidationException::withMessages([
                    'data.scheduled_departure_at' => 'Scheduled departure must be a valid date and time.',
                ]);
            }
            $trip->scheduled_departure_at = $parsed;
        }

        if (array_key_exists('capacity', $data)) {
            $resolved = $this->readCapacity($data['capacity'], $trip);
            if ($resolved === null) {
                throw ValidationException::withMessages([
                    'data.capacity' => 'Trip capacity is required.',
                ]);
            }
            $trip->capacity = $resolved;
        }

        if (array_key_exists('boat_type_id', $data)) {
            $trip->boat_type_id = $this->resolveOptionalFkUuid($data['boat_type_id'], BoatType::class);
        }

        if (array_key_exists('water_route_id', $data)) {
            $trip->water_route_id = $this->resolveOptionalFkUuid($data['water_route_id'], WaterRoute::class);
        }

        $trip->save();
    }

    private function readUuid(mixed $value): ?string
    {
        if (! is_string($value) || ! Str::isUuid($value)) {
            return null;
        }

        return $value;
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function resolveOptionalFkUuid(mixed $value, string $modelClass): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value) && trim($value) === '') {
            return null;
        }

        $uuid = $this->readUuid($value);
        if ($uuid === null) {
            return null;
        }

        if (! $modelClass::query()->whereKey($uuid)->exists()) {
            return null;
        }

        return $uuid;
    }

    private function readDateTime(mixed $value): ?CarbonImmutable
    {
        if ($value === null) {
            return null;
        }

        if ($value === '') {
            return null;
        }

        if (! is_string($value) && ! $value instanceof \DateTimeInterface) {
            return null;
        }

        try {
            return CarbonImmutable::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function readCapacity(mixed $value, ?Trip $existing): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '' || ! is_numeric($trimmed)) {
                return $existing?->capacity;
            }
            $value = (int) $trimmed;
        }

        if (is_float($value)) {
            $value = (int) round($value);
        }

        if (! is_int($value) || $value < 1) {
            return $existing?->capacity;
        }

        return $value;
    }
}
