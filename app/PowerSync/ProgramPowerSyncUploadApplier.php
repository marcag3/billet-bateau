<?php

namespace App\PowerSync;

use App\Models\Address;
use App\Models\Program;
use Illuminate\Support\Str;

final class ProgramPowerSyncUploadApplier
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
            $program = Program::query()
                ->whereKey($id)
                ->where('user_id', $userId)
                ->first();

            $program?->delete();

            return;
        }

        if ($op === 'PUT') {
            $existing = Program::query()->whereKey($id)->first();
            if ($existing !== null && (int) $existing->user_id !== $userId) {
                return;
            }

            $name = isset($data['name']) && is_string($data['name']) ? trim($data['name']) : '';
            $description = isset($data['description']) && is_string($data['description']) ? $data['description'] : null;
            $themeColor = isset($data['theme_color']) && is_string($data['theme_color']) ? strtoupper(trim($data['theme_color'])) : '#000000';

            if (! preg_match('/^#[0-9A-F]{6}$/', $themeColor)) {
                $themeColor = '#000000';
            }

            $attributes = [
                'user_id' => $userId,
                'name' => $name !== '' ? $name : 'Untitled',
                'description' => $description,
                'theme_color' => $themeColor,
            ];

            if (array_key_exists('address_id', $data)) {
                $attributes['address_id'] = $this->resolveAddressId($id, $data['address_id'], $existing);
            }

            Program::query()->updateOrCreate(
                ['id' => $id],
                $attributes,
            );

            return;
        }

        if ($op === 'PATCH') {
            $program = Program::query()
                ->whereKey($id)
                ->where('user_id', $userId)
                ->first();

            if ($program === null) {
                return;
            }

            if (array_key_exists('name', $data) && is_string($data['name'])) {
                $trimmed = trim($data['name']);
                if ($trimmed !== '') {
                    $program->name = $trimmed;
                }
            }

            if (array_key_exists('description', $data) && (is_string($data['description']) || $data['description'] === null)) {
                $program->description = $data['description'];
            }

            if (array_key_exists('theme_color', $data) && is_string($data['theme_color'])) {
                $next = strtoupper(trim($data['theme_color']));
                if (preg_match('/^#[0-9A-F]{6}$/', $next) === 1) {
                    $program->theme_color = $next;
                }
            }

            if (array_key_exists('address_id', $data)) {
                $program->address_id = $this->resolveAddressId($id, $data['address_id'], $program);
            }

            $program->save();

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for programs: '.$op);
    }

    /**
     * @return ?string UUID or null; keeps the existing FK when the requested id is missing, invalid, in use by another program, or unchanged when resolving fails
     */
    private function resolveAddressId(string $programId, mixed $value, ?Program $existing): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value) && trim($value) === '') {
            return null;
        }

        if (! is_string($value) || ! Str::isUuid($value)) {
            return $existing?->address_id;
        }

        if (! Address::query()->whereKey($value)->exists()) {
            return $existing?->address_id;
        }

        $owner = Program::query()
            ->where('address_id', $value)
            ->where('id', '!=', $programId)
            ->first();

        if ($owner !== null) {
            return $existing?->address_id;
        }

        return $value;
    }
}
