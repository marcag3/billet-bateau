<?php

namespace Database\Factories;

use App\Enums\VoyageStatus;
use App\Models\Trip;
use App\Models\User;
use App\Models\Voyage;
use App\Models\WaterRoute;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Voyage>
 */
class VoyageFactory extends Factory
{
    protected $model = Voyage::class;

    public function configure(): static
    {
        return $this->afterCreating(function (Voyage $voyage): void {
            $route = $voyage->waterRoute;
            if ($route !== null && (string) $route->user_id !== (string) $voyage->user_id) {
                $route->forceFill(['user_id' => $voyage->user_id])->save();
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'trip_id' => null,
            'water_route_id' => WaterRoute::factory(),
            'scheduled_departure_at' => fake()->optional(0.4)->dateTimeBetween('+1 hour', '+1 week'),
            'started_at' => null,
            'arrived_at' => null,
            'status' => VoyageStatus::Draft,
        ];
    }

    public function forTrip(Trip $trip, ?WaterRoute $waterRoute = null): static
    {
        return $this->state(function () use ($trip, $waterRoute): array {
            $route = $waterRoute ?? WaterRoute::factory()->create([
                'user_id' => $trip->user_id,
            ]);

            return [
                'user_id' => $trip->user_id,
                'trip_id' => $trip->getKey(),
                'water_route_id' => $route->getKey(),
                'scheduled_departure_at' => null,
            ];
        });
    }

    public function adHoc(User $user, WaterRoute $waterRoute): static
    {
        return $this->state(fn (): array => [
            'user_id' => $user->getKey(),
            'trip_id' => null,
            'water_route_id' => $waterRoute->getKey(),
            'scheduled_departure_at' => fake()->dateTimeBetween('+1 hour', '+1 week'),
        ]);
    }
}
