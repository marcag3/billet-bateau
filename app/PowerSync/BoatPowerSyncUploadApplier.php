<?php

namespace App\PowerSync;

use App\Models\Boat;
use App\Models\BoatType;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class BoatPowerSyncUploadApplier
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
            $boat = Boat::query()->whereKey($id)->first();

            $boat?->delete();

            return;
        }
        // TODO: how can we simplify, maybe existing packages? maybe use dto?
        if ($op === 'PUT') {
            $existing = Boat::query()->whereKey($id)->first();

            $name = isset($data['name']) && is_string($data['name']) ? trim($data['name']) : '';
            $notes = array_key_exists('notes', $data)
                ? $this->normalizeNotesValue($data['notes'])
                : $existing?->notes;
            $capacity = array_key_exists('capacity', $data)
                ? $this->readCapacity($data['capacity'], $existing)
                : $existing?->capacity;
            $boatTypeId = array_key_exists('boat_type_id', $data)
                ? $this->resolveBoatTypeId($data['boat_type_id'], $existing)
                : $existing?->boat_type_id;

            if ($capacity === null) {
                throw ValidationException::withMessages([
                    'data.capacity' => 'Boat capacity is required.',
                ]);
            }

            Boat::query()->updateOrCreate(
                ['id' => $id],
                [
                    'user_id' => $userId,
                    'name' => $name !== '' ? $name : 'Untitled',
                    'capacity' => $capacity,
                    'notes' => $notes,
                    'boat_type_id' => $boatTypeId,
                ],
            );

            return;
        }

        if ($op === 'PATCH') {
            $boat = Boat::query()->whereKey($id)->first();

            if ($boat === null) {
                return;
            }

            if (array_key_exists('name', $data) && is_string($data['name'])) {
                $trimmed = trim($data['name']);
                if ($trimmed !== '') {
                    $boat->name = $trimmed;
                }
            }

            if (array_key_exists('notes', $data)) {
                $boat->notes = $this->normalizeNotesValue($data['notes']);
            }

            if (array_key_exists('capacity', $data)) {
                $resolved = $this->readCapacity($data['capacity'], $boat);
                $boat->capacity = $resolved === null ? (int) $boat->capacity : $resolved;
            }

            if (array_key_exists('boat_type_id', $data)) {
                $boat->boat_type_id = $this->resolveBoatTypeId($data['boat_type_id'], $boat);
            }

            $boat->save();

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for boats: '.$op);
    }

    private function normalizeNotesValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }

    private function readCapacity(mixed $value, ?Boat $existing): ?int
    {
        if ($value === null) {
            return null;
        }

        if ($value === '') {
            return null;
        }

        if (is_string($value) && trim($value) === '') {
            return null;
        }

        if (is_bool($value)) {
            return $existing?->capacity;
        }

        if (is_float($value)) {
            $value = (int) round($value);
        }

        if (is_string($value)) {
            $trimmed = trim($value);
            if ($trimmed === '' || ! is_numeric($trimmed)) {
                return $existing?->capacity;
            }
            $value = (int) $trimmed;
        }

        if (! is_int($value) || $value < 0) {
            return $existing?->capacity;
        }

        return $value;
    }

    private function resolveBoatTypeId(mixed $value, ?Boat $existing): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value) && trim($value) === '') {
            return null;
        }

        if (! is_string($value) || ! Str::isUuid($value)) {
            return $existing?->boat_type_id;
        }

        if (! BoatType::query()->whereKey($value)->exists()) {
            return $existing?->boat_type_id;
        }

        return $value;
    }
}
