<?php

namespace App\Data\PowerSync\Trips;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync trips PATCH (inner {@code data} object).
 */
final class TripPatchData extends Data
{
    public function __construct(
        public string|Optional|null $program_id = new Optional,
        public CarbonImmutable|Optional|null $scheduled_departure_at = new Optional,
        public string|Optional|null $product_id = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['sometimes', 'nullable', 'ulid'],
            'scheduled_departure_at' => ['sometimes', 'date'],
            'product_id' => ['sometimes', 'nullable', 'ulid', 'exists:products,id'],
        ];
    }
}
