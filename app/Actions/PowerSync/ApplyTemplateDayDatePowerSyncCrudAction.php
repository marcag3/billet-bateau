<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\TemplateDayDates\TemplateDayDatePatchData;
use App\Data\PowerSync\TemplateDayDates\TemplateDayDatePutData;
use App\Data\PowerSync\TemplateDayDates\TemplateDayDatePutPayloadResolver;
use App\Data\PowerSync\TemplateDayDates\TemplateDayDateResolvedPutData;
use App\Models\TemplateDay;
use App\Models\TemplateDayDate;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * @extends PowerSyncCrudAction<TemplateDayDatePutData, TemplateDayDatePatchData>
 */
final class ApplyTemplateDayDatePowerSyncCrudAction extends PowerSyncCrudAction
{
    protected function tableName(): string
    {
        return 'template_day_dates';
    }

    protected function putDataClass(): string
    {
        return TemplateDayDatePutData::class;
    }

    protected function patchDataClass(): string
    {
        return TemplateDayDatePatchData::class;
    }

    protected function applyDelete(string $id, string $userId): void
    {
        $dateRow = TemplateDayDate::query()->whereKey($id)->first();

        if ($dateRow === null) {
            return;
        }

        $this->assertProgramManaged($dateRow->program_id, $userId);

        $dateRow->delete();
    }

    /**
     * @param  TemplateDayDatePutData  $dto
     */
    protected function applyPut(string $id, Data $dto, string $userId): void
    {
        $existing = TemplateDayDate::query()->whereKey($id)->first();

        $merged = TemplateDayDatePutPayloadResolver::resolve($dto, $existing);
        $resolved = TemplateDayDateResolvedPutData::validateAndCreate($merged);

        $this->assertProgramManaged($resolved->program_id, $userId);

        $this->assertUniqueTemplateDayDate($id, $resolved->template_day_id, $resolved->service_date);

        TemplateDayDate::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $resolved->program_id,
                'template_day_id' => $resolved->template_day_id,
                'service_date' => $resolved->service_date->toDateString(),
            ],
        );
    }

    /**
     * @param  TemplateDayDatePatchData  $patch
     */
    protected function applyPatch(string $id, Data $patch, string $userId): void
    {
        $dateRow = TemplateDayDate::query()->whereKey($id)->first();

        if ($dateRow === null) {
            return;
        }

        $this->assertProgramManaged($dateRow->program_id, $userId);

        $templateDayId = (string) $dateRow->template_day_id;

        if (! ($patch->template_day_id instanceof Optional)) {
            $incoming = $patch->template_day_id;
            if ($incoming !== null && $incoming !== $templateDayId) {
                $templateDay = TemplateDay::query()->whereKey($incoming)->first();

                if ($templateDay === null || (string) $templateDay->program_id !== (string) $dateRow->program_id) {
                    throw new AuthorizationException;
                }

                $templateDayId = $incoming;
            }
        }

        $serviceDate = CarbonImmutable::parse((string) $dateRow->service_date)->startOfDay();

        if (! ($patch->service_date instanceof Optional)) {
            if ($patch->service_date !== null) {
                $serviceDate = CarbonImmutable::parse((string) $patch->service_date)->startOfDay();
            }
        }

        $this->assertUniqueTemplateDayDate($id, $templateDayId, $serviceDate);

        if (! ($patch->template_day_id instanceof Optional) && $patch->template_day_id !== null) {
            $dateRow->template_day_id = $templateDayId;
        }

        if (! ($patch->service_date instanceof Optional)) {
            $dateRow->service_date = $serviceDate;
        }

        $dateRow->save();
    }

    private function assertUniqueTemplateDayDate(string $id, string $templateDayId, CarbonImmutable $serviceDate): void
    {
        $exists = TemplateDayDate::query()
            ->where('template_day_id', $templateDayId)
            ->whereDate('service_date', $serviceDate->toDateString())
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'data.service_date' => 'This template day already has an entry for this date.',
            ]);
        }
    }
}
