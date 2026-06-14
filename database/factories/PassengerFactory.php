<?php

namespace Database\Factories;

use App\Models\Passenger;
use App\Models\Voyage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Passenger>
 */
class PassengerFactory extends Factory
{
    protected $model = Passenger::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'voyage_id' => Voyage::factory(),
            'name' => fake()->name(),
            'booking_id' => null,
            'check_in_id' => null,
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function forVoyage(Voyage $voyage): static
    {
        return $this->state(fn (): array => [
            'voyage_id' => $voyage->getKey(),
        ]);
    }
}
