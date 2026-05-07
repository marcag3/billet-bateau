<?php

namespace App\Data\PowerSync\Programs;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync programs PUT before persistence.
 */
final class ProgramResolvedPutData extends Data
{
    public function __construct(
        public string $name,
        public ?string $description,
        public string $theme_color,
        public bool $is_active,
        public bool $is_archived,
        public string $base_slug,
        public ?string $line_1,
        public ?string $line_2,
        public ?string $city,
        public ?string $postal_code,
        public ?string $country,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'theme_color' => ['required', 'string', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'is_active' => ['required', 'boolean'],
            'is_archived' => ['required', 'boolean'],
            'base_slug' => ['required', 'string', 'max:255'],
            'line_1' => ['nullable', 'string', 'max:255'],
            'line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:32'],
            'country' => ['nullable', 'string', 'max:120'],
        ];
    }
}
