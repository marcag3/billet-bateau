<?php

namespace App\Data\PowerSync\Trips;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for PowerSync trips PUT (inner {@code data} object).
 *
 * Omitted keys remain {@see Optional} so PUT can merge with an existing row; invalid present values fail validation.
 */
final class TripPutData extends Data
{
    public function __construct(
        public string|Optional|null $program_id = new Optional,
        public CarbonImmutable|Optional|null $scheduled_departure_at = new Optional,
        public int|Optional|null $capacity = new Optional,
        public string|Optional|null $boat_type_id = new Optional,
        public string|Optional|null $water_route_id = new Optional,
        public string|Optional|null $template_day_slot_id = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['sometimes', 'nullable', 'ulid'],
            'scheduled_departure_at' => ['sometimes', 'nullable', 'date'],
            'capacity' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'boat_type_id' => ['sometimes', 'nullable', 'ulid', 'exists:boat_types,id'],
            'water_route_id' => ['sometimes', 'nullable', 'ulid', 'exists:water_routes,id'],
            'template_day_slot_id' => ['sometimes', 'nullable', 'ulid', 'exists:template_day_slots,id'],
        ];
    }
}
