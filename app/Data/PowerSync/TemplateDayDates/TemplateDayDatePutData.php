<?php

namespace App\Data\PowerSync\TemplateDayDates;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

final class TemplateDayDatePutData extends Data
{
    public function __construct(
        public string|Optional|null $program_id = new Optional,
        public string|Optional|null $template_day_id = new Optional,
        public string|Optional|null $service_date = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['sometimes', 'nullable', 'uuid'],
            'template_day_id' => ['sometimes', 'nullable', 'uuid', 'exists:template_days,id'],
            'service_date' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
