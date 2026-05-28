<?php

namespace App\Data\PowerSync\Voyages;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Optional;

final class VoyagePutData extends Data
{
    public function __construct(
        public string|Optional|null $program_id = new Optional,
        public string|Optional|null $trip_id = new Optional,
        public string|Optional|null $water_route_id = new Optional,
        public CarbonImmutable|Optional|null $scheduled_departure_at = new Optional,
        public CarbonImmutable|Optional|null $started_at = new Optional,
        public CarbonImmutable|Optional|null $arrived_at = new Optional,
        public string|Optional|null $status = new Optional,
        public string|Optional|null $user_id = new Optional,
    ) {}

    /**
     * @return array<string, list<string|ValidationRule|Enum>>
     */
    public static function rules(): array
    {
        return [
            'program_id' => ['sometimes', 'nullable', 'ulid', 'exists:programs,id'],
            'trip_id' => ['sometimes', 'nullable', 'ulid', 'exists:trips,id'],
            'water_route_id' => ['sometimes', 'nullable', 'ulid', 'exists:water_routes,id'],
            'scheduled_departure_at' => ['sometimes', 'nullable', 'date'],
            'started_at' => ['sometimes', 'nullable', 'date'],
            'arrived_at' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'nullable', 'string', Rule::in(['draft', 'ready', 'underway', 'completed', 'cancelled'])],
            'user_id' => ['sometimes', 'nullable', 'ulid', 'exists:users,id'],
        ];
    }
}
