<?php

namespace Database\Factories;

use App\Enums\VoyageStatus;
use App\Models\Program;
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

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
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
            $programUserId = Program::query()->whereKey($trip->program_id)->value('user_id');
            $route = $waterRoute ?? WaterRoute::factory()->create([
                'program_id' => $trip->program_id,
            ]);
            if ((string) $route->program_id !== (string) $trip->program_id) {
                $route->forceFill(['program_id' => $trip->program_id])->save();
            }

            return [
                'user_id' => $programUserId,
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
