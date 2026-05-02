<?php

namespace Database\Factories;

use App\Models\Boat;
use App\Models\BoatType;
use App\Models\Program;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Boat>
 */
class BoatFactory extends Factory
{
    protected $model = Boat::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'user_id' => User::factory(),
            'boat_type_id' => null,
            'program_id' => Program::factory(),
            'name' => fake()->words(2, true),
            'capacity' => fake()->numberBetween(1, 500),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function forBoatType(BoatType $boatType): static
    {
        return $this->state(fn (): array => [
            'user_id' => $boatType->user_id,
            'boat_type_id' => $boatType->getKey(),
            'program_id' => $boatType->program_id,
        ]);
    }
}
