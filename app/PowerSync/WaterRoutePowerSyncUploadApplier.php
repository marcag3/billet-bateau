<?php

namespace App\PowerSync;

use App\Models\Program;
use App\Models\WaterRoute;
use Clickbar\Magellan\Data\Geometries\LineString;
use Clickbar\Magellan\Facades\GeojsonParser;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class WaterRoutePowerSyncUploadApplier
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
            $this->applyDelete($id, $userId);

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

        throw new \RuntimeException('Unsupported PowerSync CRUD op for water_routes: '.$op);
    }

    private function applyDelete(string $id, int $userId): void
    {
        $route = WaterRoute::query()->whereKey($id)->first();

        if ($route === null) {
            return;
        }

        $program = Program::query()->whereKey($route->program_id)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

        if ($route->voyages()->exists()) {
            throw ValidationException::withMessages([
                'id' => 'Cannot delete a water route that is still used by a voyage.',
            ]);
        }

        $route->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function applyPut(string $id, array $data, int $userId): void
    {
        $existing = WaterRoute::query()->whereKey($id)->first();

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

        $name = $this->readName($data, $existing);
        $durationMinutes = $this->readDurationMinutes($data, $existing);
        $trace = $this->readTrace($data, $existing);

        WaterRoute::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $programId,
                'name' => $name,
                'duration_minutes' => $durationMinutes,
                'trace' => $trace,
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function applyPatch(string $id, array $data, int $userId): void
    {
        $route = WaterRoute::query()->whereKey($id)->first();

        if ($route === null) {
            return;
        }

        $program = Program::query()->whereKey($route->program_id)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

        if (array_key_exists('program_id', $data)) {
            $incoming = $this->readUuid($data['program_id']);
            if ($incoming !== null && $incoming !== (string) $route->program_id) {
                throw new AuthorizationException;
            }
        }

        if (array_key_exists('name', $data)) {
            $route->name = $this->readName($data, $route);
        }

        if (array_key_exists('duration_minutes', $data)) {
            $route->duration_minutes = $this->readDurationMinutes($data, $route);
        }

        if (array_key_exists('trace', $data)) {
            $route->trace = $this->readTrace($data, $route);
        }

        $route->save();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function readName(array $data, ?WaterRoute $existing): string
    {
        if (array_key_exists('name', $data) && is_string($data['name'])) {
            $trimmed = trim($data['name']);
            if ($trimmed !== '') {
                return $trimmed;
            }
        }

        if ($existing !== null) {
            return (string) $existing->name;
        }

        return 'Untitled';
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function readDurationMinutes(array $data, ?WaterRoute $existing): int
    {
        if (! array_key_exists('duration_minutes', $data)) {
            if ($existing !== null) {
                return (int) $existing->duration_minutes;
            }

            throw ValidationException::withMessages([
                'data.duration_minutes' => 'Duration is required.',
            ]);
        }

        $value = $data['duration_minutes'];
        if ($value === null || $value === '') {
            if ($existing !== null) {
                return (int) $existing->duration_minutes;
            }

            throw ValidationException::withMessages([
                'data.duration_minutes' => 'Duration is required.',
            ]);
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '' || ! is_numeric($trimmed)) {
                throw ValidationException::withMessages([
                    'data.duration_minutes' => 'Duration must be a positive integer.',
                ]);
            }
            $value = (int) $trimmed;
        }

        if (is_float($value)) {
            $value = (int) round($value);
        }

        if (! is_int($value) || $value < 1) {
            throw ValidationException::withMessages([
                'data.duration_minutes' => 'Duration must be a positive integer.',
            ]);
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function readTrace(array $data, ?WaterRoute $existing): LineString
    {
        if (! array_key_exists('trace', $data)) {
            if ($existing !== null && $existing->trace instanceof LineString) {
                return $existing->trace;
            }

            throw ValidationException::withMessages([
                'data.trace' => 'Trace geometry is required.',
            ]);
        }

        return $this->parseTraceToLineString($data['trace']);
    }

    private function parseTraceToLineString(mixed $value): LineString
    {
        if (! is_string($value)) {
            throw ValidationException::withMessages([
                'data.trace' => 'Trace must be a GeoJSON LineString string.',
            ]);
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            throw ValidationException::withMessages([
                'data.trace' => 'Trace geometry is required.',
            ]);
        }

        try {
            $geometry = GeojsonParser::parse($trimmed);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'data.trace' => 'Trace must be valid GeoJSON (LineString).',
            ]);
        }

        if (! $geometry instanceof LineString) {
            throw ValidationException::withMessages([
                'data.trace' => 'Trace must be a GeoJSON LineString.',
            ]);
        }

        return $geometry;
    }

    private function readUuid(mixed $value): ?string
    {
        if (! is_string($value) || ! Str::isUuid($value)) {
            return null;
        }

        return $value;
    }
}
