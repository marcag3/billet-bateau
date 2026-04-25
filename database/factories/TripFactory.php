<?php

namespace Database\Factories;

use App\Models\BoatType;
use App\Models\Program;
use App\Models\Trip;
use App\Models\User;
use App\Models\WaterRoute;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Trip>
 */
class TripFactory extends Factory
{
    protected $model = Trip::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $user = User::factory();

        return [
            'id' => (string) Str::uuid(),
            'user_id' => $user,
            'program_id' => Program::factory()->for($user),
            'boat_type_id' => null,
            'water_route_id' => null,
            'title' => fake()->optional()->sentence(3),
            'scheduled_departure_at' => fake()->dateTimeBetween('+1 day', '+2 months'),
            'capacity' => fake()->optional()->numberBetween(4, 60),
        ];
    }

    public function forProgram(Program $program): static
    {
        return $this->state(fn (): array => [
            'user_id' => $program->user_id,
            'program_id' => $program->getKey(),
        ]);
    }

    public function withWaterRoute(?WaterRoute $waterRoute = null): static
    {
        return $this->afterCreating(function (Trip $trip) use ($waterRoute): void {
            if ($waterRoute !== null) {
                if ((string) $waterRoute->user_id !== (string) $trip->user_id) {
                    $waterRoute->forceFill(['user_id' => $trip->user_id])->save();
                }
                $trip->update(['water_route_id' => $waterRoute->getKey()]);

                return;
            }

            $route = WaterRoute::factory()->create(['user_id' => $trip->user_id]);
            $trip->update(['water_route_id' => $route->getKey()]);
        });
    }

    public function withBoatType(?BoatType $boatType = null): static
    {
        return $this->afterCreating(function (Trip $trip) use ($boatType): void {
            $type = $boatType ?? BoatType::factory()->create(['user_id' => $trip->user_id]);
            $trip->update(['boat_type_id' => $type->getKey()]);
        });
    }
}
