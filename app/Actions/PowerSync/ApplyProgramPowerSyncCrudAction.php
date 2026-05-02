<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\Programs\ProgramPatchData;
use App\Data\PowerSync\Programs\ProgramPutData;
use App\Data\PowerSync\Programs\ProgramPutPayloadResolver;
use App\Data\PowerSync\Values\SlugNormalizer;
use App\Models\Program;
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

    public function handle(PowerSyncCrudEntryData $entry, int $userId): void
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
            $program->delete();

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

    private function applyPut(string $id, ProgramPutData $dto, int $userId): void
    {
        $existing = Program::query()->whereKey($id)->first();

        if ($existing !== null) {
            $this->ensureUserManagesProgram($existing, $userId);
        }

        $merged = ProgramPutPayloadResolver::resolve($dto, $existing);

        $attributes = [
            'name' => $merged['name'],
            'description' => $merged['description'],
            'theme_color' => $merged['theme_color'],
            'is_active' => $merged['is_active'],
            'is_archived' => $merged['is_archived'],
            'slug' => $this->assignUniqueSlug((string) $id, $merged['base_slug']),
            'line_1' => $merged['line_1'],
            'line_2' => $merged['line_2'],
            'city' => $merged['city'],
            'postal_code' => $merged['postal_code'],
            'country' => $merged['country'],
        ];

        Program::query()->updateOrCreate(
            ['id' => $id],
            $attributes,
        );

        if ($existing === null) {
            Program::query()->whereKey($id)->first()?->users()->syncWithoutDetaching([$userId]);
        }
    }

    private function applyPatch(string $id, ProgramPatchData $patch, int $userId): void
    {
        $program = Program::query()->whereKey($id)->first();

        if ($program === null) {
            return;
        }

        $this->ensureUserManagesProgram($program, $userId);

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

        $program->save();
    }

    private function ensureUserManagesProgram(Program $program, int $userId): void
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
