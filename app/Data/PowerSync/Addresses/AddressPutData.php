<?php

namespace App\Data\PowerSync\Addresses;

use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;

/**
 * Validated payload for PowerSync addresses PUT (inner {@code data} object).
 */
final class AddressPutData extends Data
{
    public function __construct(
        #[WithCast(TrimmedNullableStringCast::class)]
        public ?string $line_1 = null,
        #[WithCast(TrimmedNullableStringCast::class)]
        public ?string $line_2 = null,
        #[WithCast(TrimmedNullableStringCast::class)]
        public ?string $city = null,
        #[WithCast(TrimmedNullableStringCast::class)]
        public ?string $postal_code = null,
        #[WithCast(TrimmedNullableStringCast::class)]
        public ?string $country = null,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'line_1' => ['nullable', 'string', 'max:255'],
            'line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:32'],
            'country' => ['nullable', 'string', 'max:120'],
        ];
    }
}
