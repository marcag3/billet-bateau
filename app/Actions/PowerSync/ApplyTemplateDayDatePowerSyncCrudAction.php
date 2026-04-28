<?php

namespace App\Actions\PowerSync;

use App\Data\PowerSync\PowerSyncCrudEntryData;
use App\Data\PowerSync\TemplateDayDates\TemplateDayDatePatchData;
use App\Data\PowerSync\TemplateDayDates\TemplateDayDatePutData;
use App\Data\PowerSync\TemplateDayDates\TemplateDayDatePutPayloadResolver;
use App\Models\Program;
use App\Models\TemplateDay;
use App\Models\TemplateDayDate;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Lorisleiva\Actions\Concerns\AsAction;
use Spatie\LaravelData\Optional;

final class ApplyTemplateDayDatePowerSyncCrudAction
{
    use AsAction;

    public function handle(PowerSyncCrudEntryData $entry, int $userId): void
    {
        $id = $entry->id;
        $op = $entry->op;
        /** @var array<string, mixed> $raw */
        $raw = $entry->data ?? [];

        if ($op === PowerSyncCrudEntryData::OP_DELETE) {
            $dateRow = TemplateDayDate::query()->whereKey($id)->first();

            if ($dateRow === null) {
                return;
            }

            $program = Program::query()->whereKey($dateRow->program_id)->first();

            if ($program === null || ! $program->userCanManage($userId)) {
                throw new AuthorizationException;
            }

            $dateRow->delete();

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PUT) {
            $dto = TemplateDayDatePutData::validateAndCreate($raw);
            $this->applyPut($id, $dto, $userId);

            return;
        }

        if ($op === PowerSyncCrudEntryData::OP_PATCH) {
            $patch = TemplateDayDatePatchData::validateAndCreate($raw);
            $this->applyPatch($id, $patch, $userId);

            return;
        }

        throw new \RuntimeException('Unsupported PowerSync CRUD op for template_day_dates: '.$op);
    }

    private function applyPut(string $id, TemplateDayDatePutData $dto, int $userId): void
    {
        $existing = TemplateDayDate::query()->whereKey($id)->first();

        $resolved = TemplateDayDatePutPayloadResolver::resolve($dto, $existing);

        $program = Program::query()->whereKey($resolved['program_id'])->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

        $this->assertUniqueTemplateDayDate($id, $resolved['template_day_id'], $resolved['service_date']);

        TemplateDayDate::query()->updateOrCreate(
            ['id' => $id],
            [
                'program_id' => $resolved['program_id'],
                'template_day_id' => $resolved['template_day_id'],
                'service_date' => $resolved['service_date']->toDateString(),
            ],
        );
    }

    private function applyPatch(string $id, TemplateDayDatePatchData $patch, int $userId): void
    {
        $dateRow = TemplateDayDate::query()->whereKey($id)->first();

        if ($dateRow === null) {
            return;
        }

        $program = Program::query()->whereKey($dateRow->program_id)->first();

        if ($program === null || ! $program->userCanManage($userId)) {
            throw new AuthorizationException;
        }

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
            $dateRow->service_date = $serviceDate->toDateString();
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
