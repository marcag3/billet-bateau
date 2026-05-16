<?php

namespace App\Data\PowerSync\Trips;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

/**
 * Fully validated merged shape for PowerSync trips PUT before persistence.
 */
final class TripResolvedPutData extends Data
{
    public function __construct(
        public CarbonImmutable $scheduled_departure_at,
        public string $product_id,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'scheduled_departure_at' => ['required', 'date'],
            'product_id' => ['required', 'ulid', 'exists:products,id'],
        ];
    }
}
