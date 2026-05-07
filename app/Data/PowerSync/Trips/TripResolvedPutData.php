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
        public int $capacity,
        public ?string $boat_type_id,
        public ?string $water_route_id,
        public ?string $template_day_slot_id,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'scheduled_departure_at' => ['required', 'date'],
            'capacity' => ['required', 'integer', 'min:1'],
            'boat_type_id' => ['nullable', 'ulid', 'exists:boat_types,id'],
            'water_route_id' => ['nullable', 'ulid', 'exists:water_routes,id'],
            'template_day_slot_id' => ['nullable', 'ulid', 'exists:template_day_slots,id'],
        ];
    }
}
