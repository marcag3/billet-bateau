<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\TemplateDays\TemplateDayPatchData;
use App\Data\PowerSync\TemplateDays\TemplateDayPutData;
use App\Data\PowerSync\TemplateDays\TemplateDayPutPayloadResolver;
use App\Data\PowerSync\TemplateDays\TemplateDayResolvedPutData;
use App\Models\TemplateDay;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * @extends PowerSyncCrudAction<TemplateDayPutData, TemplateDayPatchData>
 */
final class ApplyTemplateDayPowerSyncCrudAction extends PowerSyncCrudAction
{
    protected function tableName(): string
    {
        return 'template_days';
    }

    protected function putDataClass(): string
    {
        return TemplateDayPutData::class;
    }

    protected function patchDataClass(): string
    {
        return TemplateDayPatchData::class;
    }

    protected function applyDelete(string $id, string $userId): void
    {
        $templateDay = TemplateDay::query()->whereKey($id)->first();

        if ($templateDay === null) {
            return;
        }

        $this->assertProgramManaged($templateDay->program_id, $userId);

        $templateDay->delete();
    }

    /**
     * @param  TemplateDayPutData  $dto
     */
    protected function applyPut(string $id, Data $dto, string $userId): void
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

        $this->assertProgramManaged($programId, $userId);

        $merged = TemplateDayPutPayloadResolver::resolve($dto, $existing);
        $resolved = TemplateDayResolvedPutData::validateAndCreate($merged);

        TemplateDay::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $programId,
                'name' => $resolved->name,
            ],
        );
    }

    /**
     * @param  TemplateDayPatchData  $patch
     */
    protected function applyPatch(string $id, Data $patch, string $userId): void
    {
        $templateDay = TemplateDay::query()->whereKey($id)->first();

        if ($templateDay === null) {
            return;
        }

        $this->assertProgramManaged($templateDay->program_id, $userId);

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
