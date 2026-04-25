<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Voyage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CheckIn>
 */
class CheckInFactory extends Factory
{
    protected $model = CheckIn::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'booking_id' => Booking::factory(),
            'voyage_id' => Voyage::factory(),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function forBookingAndVoyage(Booking $booking, Voyage $voyage): static
    {
        return $this->state(fn (): array => [
            'booking_id' => $booking->getKey(),
            'voyage_id' => $voyage->getKey(),
        ]);
    }
}
