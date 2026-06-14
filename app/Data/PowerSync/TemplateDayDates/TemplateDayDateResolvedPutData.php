<?php

namespace App\Data\PowerSync\TemplateDayDates;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync template_day_dates PUT before persistence.
 */
final class TemplateDayDateResolvedPutData extends Data
{
    public function __construct(
        public string $program_id,
        public string $template_day_id,
        public CarbonImmutable $service_date,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['required', 'ulid', 'exists:programs,id'],
            'template_day_id' => ['required', 'ulid', 'exists:template_days,id'],
            'service_date' => ['required', 'date'],
        ];
    }
}
