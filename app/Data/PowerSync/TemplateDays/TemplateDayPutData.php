<?php

namespace App\Data\PowerSync\TemplateDays;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync template_days PUT (inner {@code data} object).
 */
final class TemplateDayPutData extends Data
{
    public function __construct(
        public string|Optional|null $program_id = new Optional,
        public string|Optional|null $name = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['sometimes', 'nullable', 'ulid'],
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
