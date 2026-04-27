<?php

namespace App\Data\PowerSync\BoatTypes;

use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;

/**
 * Validated payload for PowerSync boat_types PUT (inner {@code data} object).
 */
final class BoatTypePutData extends Data
{
    public function __construct(
        #[WithCast(TrimmedNullableStringCast::class)]
        public ?string $name = null,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
