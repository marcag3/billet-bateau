<?php

namespace App\PowerSync;

use App\Models\Address;
use App\Models\Program;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Str;

final class ProgramPowerSyncUploadApplier
{
    private const SLUG_MAX_LENGTH = 200;

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
            $program = Program::query()->whereKey($id)->first();

            if ($program === null) {
                return;
            }

            $this->ensureUserManagesProgram($program, $userId);
            $program->delete();

            return;
        }

        if ($op === 'PUT') {
            $existing = Program::query()->whereKey($id)->first();

            if ($existing !== null) {
                $this->ensureUserManagesProgram($existing, $userId);
            }

            $name = isset($data['name']) && is_string($data['name']) ? trim($data['name']) : '';
            $description = isset($data['description']) && is_string($data['description']) ? $data['description'] : null;
            $themeColor = isset($data['theme_color']) && is_string($data['theme_color']) ? strtoupper(trim($data['theme_color'])) : '#000000';

            if (! preg_match('/^#[0-9A-F]{6}$/', $themeColor)) {
                $themeColor = '#000000';
            }

            $isActive = $this->coerceToBool($data['is_active'] ?? null) ?? false;
            $isArchived = $this->coerceToBool($data['is_archived'] ?? null) ?? false;

            $displayName = $name !== '' ? $name : 'Untitled';
            $proposedSlug = array_key_exists('slug', $data)
                ? $this->normalizeSlugValue($data['slug'])
                : $this->normalizeSlugValue($displayName);
            $baseSlug = $proposedSlug !== null && $proposedSlug !== '' ? $proposedSlug : 'program';

            $attributes = [
                'user_id' => $userId,
                'name' => $displayName,
                'description' => $description,
                'theme_color' => $themeColor,
                'is_active' => $isActive,
                'is_archived' => $isArchived,
                'slug' => $this->assignUniqueSlug((string) $id, $baseSlug),
            ];

            if (array_key_exists('address_id', $data)) {
                $attributes['address_id'] = $this->resolveAddressId($id, $data['address_id'], $existing);
            }

            Program::query()->updateOrCreate(
                ['id' => $id],
                $attributes,
            );

            if ($existing === null) {
                Program::query()->whereKey($id)->first()?->users()->syncWithoutDetaching([$userId]);
            }

            return;
        }

        if ($op === 'PATCH') {
            $program = Program::query()->whereKey($id)->first();

            if ($program === null) {
                return;
            }

            $this->ensureUserManagesProgram($program, $userId);

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

            if (array_key_exists('is_active', $data)) {
                $next = $this->coerceToBool($data['is_active']);
                if ($next !== null) {
                    $program->is_active = $next;
                }
            }

            if (array_key_exists('is_archived', $data)) {
                $next = $this->coerceToBool($data['is_archived']);
                if ($next !== null) {
                    $program->is_archived = $next;
                }
            }

            if (array_key_exists('slug', $data)) {
                $proposed = $this->normalizeSlugValue($data['slug']);
                $base = $proposed !== null && $proposed !== ''
                    ? $proposed
                    : ($this->normalizeSlugValue($program->name) ?? 'program');
                $program->slug = $this->assignUniqueSlug((string) $id, $base);
            }

            if (array_key_exists('address_id', $data)) {
                $program->address_id = $this->resolveAddressId($id, $data['address_id'], $program);
            }

            $program->save();

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for programs: '.$op);
    }

    private function ensureUserManagesProgram(Program $program, int $userId): void
    {
        if (! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }
    }

    private function normalizeSlugValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value) && trim($value) === '') {
            return null;
        }

        if (! is_scalar($value) && $value !== null) {
            return null;
        }

        $asString = is_string($value) ? trim($value) : (string) $value;
        if ($asString === '') {
            return null;
        }

        $slug = Str::slug(Str::ascii($asString));
        if ($slug === '') {
            return null;
        }

        if (mb_strlen($slug) > self::SLUG_MAX_LENGTH) {
            $slug = Str::limit($slug, self::SLUG_MAX_LENGTH, '');
        }

        return Str::lower($slug);
    }

    private function assignUniqueSlug(string $programId, string $baseSlug): string
    {
        $base = Str::lower($baseSlug);
        if ($base === '') {
            $base = 'program';
        }
        if (mb_strlen($base) > 255) {
            $base = Str::limit($base, 255, '');
        }
        if ($base === '') {
            $base = 'program';
        }

        if (! $this->slugInUse($base, $programId)) {
            return $base;
        }

        $n = 2;
        while (true) {
            $tail = (string) $n;
            $room = 255 - strlen($tail) - 1;
            if ($room < 1) {
                return $this->appendUniqueToken($base, $programId);
            }
            $shortBase = mb_substr($base, 0, (int) $room);
            $candidate = $shortBase.'-'.$n;
            if (! $this->slugInUse($candidate, $programId)) {
                return $candidate;
            }
            if ($n > 1000) {
                return $this->appendUniqueToken($base, $programId);
            }
            $n++;
        }
    }

    private function appendUniqueToken(string $base, string $programId): string
    {
        for ($i = 0; $i < 32; $i++) {
            $token = Str::lower(Str::random(6));
            $room = 255 - strlen($token) - 1;
            if ($room < 1) {
                continue;
            }
            $prefix = Str::limit($base, (int) $room, '');

            $candidate = $prefix !== '' ? $prefix.'-'.$token : $token;

            if (mb_strlen($candidate) > 255) {
                $candidate = Str::limit($candidate, 255, '');
            }

            if (! $this->slugInUse($candidate, $programId)) {
                return $candidate;
            }
        }

        return $base.'-'.str_pad((string) hrtime(true) % 100_000, 5, '0', STR_PAD_LEFT);
    }

    private function slugInUse(string $slug, string $exceptId): bool
    {
        return Program::query()
            ->where('slug', $slug)
            ->where('id', '!=', $exceptId)
            ->exists();
    }

    private function coerceToBool(mixed $value): ?bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value)) {
            if ($value === 0) {
                return false;
            }
            if ($value === 1) {
                return true;
            }

            return null;
        }

        if (is_string($value)) {
            $l = Str::lower(trim($value));
            if ($l === '1' || $l === 'true' || $l === 'on' || $l === 'yes') {
                return true;
            }
            if ($l === '0' || $l === 'false' || $l === 'off' || $l === 'no' || $l === '') {
                return false;
            }
        }

        return null;
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
