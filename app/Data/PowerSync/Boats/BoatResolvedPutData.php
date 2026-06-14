<?php

namespace App\Data\PowerSync\Boats;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync boats PUT before persistence.
 */
final class BoatResolvedPutData extends Data
{
    public function __construct(
        public string $name,
        public ?string $notes,
        public int $capacity,
        public ?string $boat_type_id,
        public string $program_id,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'capacity' => ['required', 'integer', 'min:0'],
            'boat_type_id' => ['nullable', 'ulid', 'exists:boat_types,id'],
            'program_id' => ['required', 'ulid', 'exists:programs,id'],
        ];
    }
}
