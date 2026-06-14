<?php

namespace App\Data\PowerSync\TemplateDays;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync template_days PUT before persistence.
 */
final class TemplateDayResolvedPutData extends Data
{
    public function __construct(
        public string $name,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}
