<?php

namespace App\Data\PowerSync\Boats;

use App\Data\PowerSync\Casts\TrimmedNullableStringCast;
use App\Data\PowerSync\Casts\TrimmedStringCast;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync boats PATCH (inner {@code data} object).
 */
final class BoatPatchData extends Data
{
    public function __construct(
        #[WithCast(TrimmedStringCast::class)]
        public string|Optional|null $name = new Optional,
        #[WithCast(TrimmedNullableStringCast::class)]
        public string|Optional|null $notes = new Optional,
        public int|Optional|null $capacity = new Optional,
        public string|Optional|null $boat_type_id = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'capacity' => ['sometimes', 'integer', 'min:0'],
            'boat_type_id' => ['sometimes', 'nullable', 'uuid', 'exists:boat_types,id'],
        ];
    }
}
