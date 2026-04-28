<?php

namespace App\Data\PowerSync\BoatPrograms;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

/**
 * Validated payload for PowerSync boat_program PUT (inner {@code data} object).
 */
final class BoatProgramPutData extends Data
{
    public function __construct(
        public string $boat_id,
        public string $program_id,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'boat_id' => ['required', 'ulid', 'exists:boats,id'],
            'program_id' => ['required', 'ulid', 'exists:programs,id'],
        ];
    }
}
