<?php

namespace App\Data\PowerSync\VoyageBoat;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

final class VoyageBoatPutData extends Data
{
    public function __construct(
        public string|Optional|null $voyage_id = new Optional,
        public string|Optional|null $boat_id = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'voyage_id' => ['sometimes', 'nullable', 'ulid', 'exists:voyages,id'],
            'boat_id' => ['sometimes', 'nullable', 'ulid', 'exists:boats,id'],
        ];
    }
}
