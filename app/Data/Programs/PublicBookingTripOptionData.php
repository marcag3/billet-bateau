<?php

namespace App\Data\Programs;

use App\Models\Trip;
use Spatie\LaravelData\Data;

final class PublicBookingTripOptionData extends Data
{
    public function __construct(
        public string $id,
        public string $scheduled_departure_at,
        public int $capacity,
        public int $remaining_capacity,
    ) {}

    public static function fromTrip(Trip $trip, int $usedSeatCount): self
    {
        $capacity = (int) $trip->capacity;
        $remaining = max(0, $capacity - $usedSeatCount);

        return new self(
            id: (string) $trip->getKey(),
            scheduled_departure_at: $trip->scheduled_departure_at->toIso8601String(),
            capacity: $capacity,
            remaining_capacity: $remaining,
        );
    }
}
