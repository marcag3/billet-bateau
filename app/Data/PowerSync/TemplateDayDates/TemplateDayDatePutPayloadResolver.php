<?php

namespace App\Data\PowerSync\TemplateDayDates;

use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Models\TemplateDay;
use App\Models\TemplateDayDate;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelData\Optional;

/**
 * @return array{program_id: string, template_day_id: string, service_date: CarbonImmutable}
 */
final class TemplateDayDatePutPayloadResolver
{
    public static function resolve(
        TemplateDayDatePutData $dto,
        ?TemplateDayDate $existing,
    ): array {
        $templateDayId = $dto->template_day_id instanceof Optional
            ? null
            : $dto->template_day_id;
        if ($templateDayId === null && $existing !== null) {
            $templateDayId = (string) $existing->template_day_id;
        }

        if ($templateDayId === null || $templateDayId === '') {
            throw ValidationException::withMessages([
                'data.template_day_id' => 'Template day is required.',
            ]);
        }

        $templateDay = TemplateDay::query()->whereKey($templateDayId)->first();

        if ($templateDay === null) {
            throw ValidationException::withMessages([
                'data.template_day_id' => 'Template day is required.',
            ]);
        }

        $programIdFromTemplate = (string) $templateDay->program_id;

        $programId = $dto->program_id instanceof Optional
            ? null
            : $dto->program_id;
        if ($programId === null) {
            $programId = $existing !== null
                ? (string) $existing->program_id
                : $programIdFromTemplate;
        }

        if ((string) $programId !== $programIdFromTemplate) {
            throw ValidationException::withMessages([
                'data.program_id' => 'Program must match the template day program.',
            ]);
        }

        $serviceDate = PowerSyncOptional::resolve($dto->service_date, $existing?->service_date);
        if (! $serviceDate instanceof CarbonImmutable) {
            $serviceDate = $serviceDate !== null
                ? CarbonImmutable::parse((string) $serviceDate)
                : null;
        }

        if ($serviceDate === null) {
            throw ValidationException::withMessages([
                'data.service_date' => 'Service date is required.',
            ]);
        }

        $serviceDate = $serviceDate->startOfDay();

        return [
            'program_id' => $programIdFromTemplate,
            'template_day_id' => (string) $templateDay->getKey(),
            'service_date' => $serviceDate,
        ];
    }
}
