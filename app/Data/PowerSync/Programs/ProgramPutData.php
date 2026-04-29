<?php

namespace App\Data\PowerSync\Programs;

use App\Data\PowerSync\Casts\LooseBooleanCast;
use App\Data\PowerSync\Casts\SlugInputCast;
use App\Data\PowerSync\Casts\ThemeColorCast;
use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use App\Data\PowerSync\Casts\TrimmedStringCast;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync programs PUT (inner {@code data} object).
 *
 * Omitted keys remain {@see Optional} so PUT can merge with an existing row.
 */
final class ProgramPutData extends Data
{
    public function __construct(
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $name = new Optional,
        public string|Optional|null $description = new Optional,
        #[WithCast(ThemeColorCast::class)]
        public string|Optional|null $theme_color = new Optional,
        #[WithCast(LooseBooleanCast::class)]
        public bool|int|string|Optional|null $is_active = new Optional,
        #[WithCast(LooseBooleanCast::class)]
        public bool|int|string|Optional|null $is_archived = new Optional,
        #[WithCast(SlugInputCast::class)]
        public string|Optional|null $slug = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $line_1 = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $line_2 = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $city = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $postal_code = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $country = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'theme_color' => ['sometimes', 'nullable', 'string', 'regex:/^#([0-9a-fA-F]{6})$/'],
            'is_active' => ['sometimes', 'nullable', 'boolean'],
            'is_archived' => ['sometimes', 'nullable', 'boolean'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255'],
            'line_1' => ['sometimes', 'nullable', 'string', 'max:255'],
            'line_2' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:120'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:32'],
            'country' => ['sometimes', 'nullable', 'string', 'max:120'],
        ];
    }
}
