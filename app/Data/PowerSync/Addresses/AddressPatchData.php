<?php

namespace App\Data\PowerSync\Addresses;

use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync addresses PATCH (inner {@code data} object).
 */
final class AddressPatchData extends Data
{
    public function __construct(
        public string|Optional|null $program_id = new Optional,
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
            'program_id' => ['sometimes', 'nullable', 'ulid', 'exists:programs,id'],
            'line_1' => ['sometimes', 'nullable', 'string', 'max:255'],
            'line_2' => ['sometimes', 'nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'nullable', 'string', 'max:120'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:32'],
            'country' => ['sometimes', 'nullable', 'string', 'max:120'],
        ];
    }
}
