<?php

namespace App\Data\PowerSync\Voyages;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;

final class VoyageResolvedPutData extends Data
{
    public function __construct(
        public string $program_id,
        public ?string $trip_id,
        public string $water_route_id,
        public ?CarbonImmutable $scheduled_departure_at,
        public string $status,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['required', 'ulid', 'exists:programs,id'],
            'trip_id' => ['nullable', 'ulid', 'exists:trips,id'],
            'water_route_id' => ['required', 'ulid', 'exists:water_routes,id'],
            'scheduled_departure_at' => ['nullable', 'date'],
            'status' => ['required', 'string', Rule::in(['draft', 'ready', 'underway', 'completed', 'cancelled'])],
        ];
    }
}
