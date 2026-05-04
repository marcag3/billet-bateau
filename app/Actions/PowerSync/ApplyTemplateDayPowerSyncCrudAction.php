<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\TemplateDays\TemplateDayPatchData;
use App\Data\PowerSync\TemplateDays\TemplateDayPutData;
use App\Data\PowerSync\TemplateDays\TemplateDayPutPayloadResolver;
use App\Models\Program;
use App\Models\TemplateDay;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

final class ApplyTemplateDayPowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, string $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $templateDay = TemplateDay::query()->whereKey($id)->first();

            if ($templateDay === null) {
                return;
            }

            $program = Program::query()->whereKey($templateDay->program_id)->first();

            if ($program === null || ! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }

            $templateDay->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = TemplateDayPutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $patch = TemplateDayPatchData::validateAndCreate($raw);
            $this->applyPatch($id, $patch, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for template_days: '.$op);
    }

    private function applyPut(string $id, TemplateDayPutData $dto, string $userId): void
    {
        $existing = TemplateDay::query()->whereKey($id)->first();

        $programIdFromData = $dto->program_id instanceof Optional
            ? null
            : $dto->program_id;

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

        $resolved = TemplateDayPutPayloadResolver::resolve($dto, $existing);

        TemplateDay::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $programId,
                'name' => $resolved['name'],
            ],
        );
    }

    private function applyPatch(string $id, TemplateDayPatchData $patch, string $userId): void
    {
        $templateDay = TemplateDay::query()->whereKey($id)->first();

        if ($templateDay === null) {
            return;
        }

        $program = Program::query()->whereKey($templateDay->program_id)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

        if (! ($patch->program_id instanceof Optional)) {
            $incoming = $patch->program_id;
            if ($incoming !== null && $incoming !== (string) $templateDay->program_id) {
                throw new AuthorizationException;
            }
        }

        if (! ($patch->name instanceof Optional)) {
            if ($patch->name !== null && $patch->name !== '') {
                $templateDay->name = $patch->name;
            }
        }

        $templateDay->save();
    }
}
