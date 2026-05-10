<?php

namespace App\Actions\PowerSync;

use App\Actions\Media\TryDeleteStoredObjectAction;
use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\Programs\ProgramPatchData;
use App\Data\PowerSync\Programs\ProgramPutData;
use App\Data\PowerSync\Programs\ProgramPutPayloadResolver;
use App\Data\PowerSync\Programs\ProgramResolvedPutData;
use App\Data\PowerSync\Values\SlugNormalizer;
use App\Models\Program;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Str;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

/**
 * Applies PowerSync CRUD for {@see Program} rows (programs upload type).
 */
final class ApplyProgramPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $program = Program::query()->whereKey($id)->first();

            if ($program === null) {
                return;
            }

            $this->ensureUserManagesProgram($program, $userId);
            $previousBannerKey = $program->banner_object_key;
            $program->delete();
            TryDeleteStoredObjectAction::run($previousBannerKey);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = ProgramPutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $patch = ProgramPatchData::validateAndCreate($raw);
            $this->applyPatch($id, $patch, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for programs: '.$op);
    }

    private function applyPut(string $id, ProgramPutData $dto, string $userId): void
    {
        $existing = Program::query()->whereKey($id)->first();

        if ($existing !== null) {
            $this->ensureUserManagesProgram($existing, $userId);
        }

        $previousBannerKey = $existing?->banner_object_key;

        $merged = ProgramPutPayloadResolver::resolve($dto, $existing);
        $resolved = ProgramResolvedPutData::validateAndCreate($merged);

        $attributes = [
            'name' => $resolved->name,
            'description' => $resolved->description,
            'theme_color' => $resolved->theme_color,
            'is_active' => $resolved->is_active,
            'is_archived' => $resolved->is_archived,
            'slug' => $this->assignUniqueSlug((string) $id, $resolved->base_slug),
            'line_1' => $resolved->line_1,
            'line_2' => $resolved->line_2,
            'city' => $resolved->city,
            'postal_code' => $resolved->postal_code,
            'country' => $resolved->country,
        ];

        $attributes = array_merge($attributes, $this->resolvedProgramBannerAttributes($resolved));

        Program::query()->updateOrCreate(
            ['id' => $id],
            $attributes,
        );

        if ($existing === null) {
            Program::query()->whereKey($id)->first()?->users()->syncWithoutDetaching([$userId]);
        }

        $newKey = Program::query()->whereKey($id)->value('banner_object_key');
        if ($this->shouldDeleteReplacedBannerObject($previousBannerKey, $newKey)) {
            TryDeleteStoredObjectAction::run($previousBannerKey);
        }
    }

    private function applyPatch(string $id, ProgramPatchData $patch, string $userId): void
    {
        $program = Program::query()->whereKey($id)->first();

        if ($program === null) {
            return;
        }

        $this->ensureUserManagesProgram($program, $userId);

        $previousBannerKey = $program->banner_object_key;

        if (! ($patch->name instanceof Optional) && $patch->name !== null && $patch->name !== '') {
            $program->name = $patch->name;
        }

        if (! ($patch->description instanceof Optional)) {
            $program->description = $patch->description;
        }

        if (! ($patch->theme_color instanceof Optional) && $patch->theme_color !== null) {
            $program->theme_color = $patch->theme_color;
        }

        if (! ($patch->is_active instanceof Optional) && $patch->is_active !== null) {
            $program->is_active = (bool) $patch->is_active;
        }

        if (! ($patch->is_archived instanceof Optional) && $patch->is_archived !== null) {
            $program->is_archived = (bool) $patch->is_archived;
        }

        if (! ($patch->slug instanceof Optional) && $patch->slug !== null) {
            $proposed = $patch->slug;
            $base = $proposed !== '' ? $proposed : (SlugNormalizer::normalize($program->name) ?? 'program');
            $program->slug = $this->assignUniqueSlug((string) $id, $base);
        }

        if (! ($patch->line_1 instanceof Optional)) {
            $program->line_1 = $patch->line_1;
        }

        if (! ($patch->line_2 instanceof Optional)) {
            $program->line_2 = $patch->line_2;
        }

        if (! ($patch->city instanceof Optional)) {
            $program->city = $patch->city;
        }

        if (! ($patch->postal_code instanceof Optional)) {
            $program->postal_code = $patch->postal_code;
        }

        if (! ($patch->country instanceof Optional)) {
            $program->country = $patch->country;
        }

        if (! ($patch->banner_object_key instanceof Optional)) {
            $program->banner_object_key = $patch->banner_object_key === '' ? null : $patch->banner_object_key;
        }

        if (! ($patch->banner_mime_type instanceof Optional)) {
            $program->banner_mime_type = $patch->banner_mime_type;
        }

        if (! ($patch->banner_size_bytes instanceof Optional)) {
            $program->banner_size_bytes = $patch->banner_size_bytes;
        }

        if (! ($patch->banner_etag instanceof Optional)) {
            $program->banner_etag = $patch->banner_etag;
        }

        if (! ($patch->banner_uploaded_at instanceof Optional)) {
            $program->banner_uploaded_at = $patch->banner_uploaded_at !== null && $patch->banner_uploaded_at !== ''
                ? CarbonImmutable::parse($patch->banner_uploaded_at)
                : null;
        }

        if ($program->banner_object_key === null || $program->banner_object_key === '') {
            $program->banner_mime_type = null;
            $program->banner_size_bytes = null;
            $program->banner_etag = null;
            $program->banner_uploaded_at = null;
        }

        $program->save();

        $newKey = $program->banner_object_key;
        if ($this->shouldDeleteReplacedBannerObject($previousBannerKey, $newKey)) {
            TryDeleteStoredObjectAction::run($previousBannerKey);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function resolvedProgramBannerAttributes(ProgramResolvedPutData $resolved): array
    {
        $key = $resolved->banner_object_key;

        if ($key === null || $key === '') {
            return [
                'banner_object_key' => null,
                'banner_mime_type' => null,
                'banner_size_bytes' => null,
                'banner_etag' => null,
                'banner_uploaded_at' => null,
            ];
        }

        return [
            'banner_object_key' => $key,
            'banner_mime_type' => $resolved->banner_mime_type,
            'banner_size_bytes' => $resolved->banner_size_bytes,
            'banner_etag' => $resolved->banner_etag,
            'banner_uploaded_at' => $resolved->banner_uploaded_at !== null && $resolved->banner_uploaded_at !== ''
                ? CarbonImmutable::parse($resolved->banner_uploaded_at)
                : null,
        ];
    }

    private function shouldDeleteReplacedBannerObject(?string $previousKey, ?string $newKey): bool
    {
        if ($previousKey === null || $previousKey === '') {
            return false;
        }

        return $previousKey !== $newKey;
    }

    private function ensureUserManagesProgram(Program $program, string $userId): void
    {
        if (! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }
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
}
