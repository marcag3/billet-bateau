<?php

namespace Database\Factories;

use App\Models\BoatType;
use App\Models\Program;
use App\Models\ProgramUser;
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
        return [
            'id' => (string) Str::ulid(),
            'program_id' => Program::factory(),
            'boat_type_id' => null,
            'water_route_id' => null,
            'template_day_slot_id' => null,
            'scheduled_departure_at' => fake()->dateTimeBetween('+1 day', '+2 months'),
            'capacity' => fake()->numberBetween(4, 60),
        ];
    }

    public function forProgram(Program $program): static
    {
        return $this->state(fn (): array => [
            'program_id' => $program->getKey(),
        ]);
    }

    public function withWaterRoute(?WaterRoute $waterRoute = null): static
    {
        return $this->afterCreating(function (Trip $trip) use ($waterRoute): void {
            $programId = (string) $trip->program_id;

            if ($waterRoute !== null) {
                if ((string) $waterRoute->program_id !== $programId) {
                    $waterRoute->forceFill(['program_id' => $programId])->save();
                }
                $trip->update(['water_route_id' => $waterRoute->getKey()]);

                return;
            }

            $route = WaterRoute::factory()->create([
                'program_id' => $programId,
            ]);
            $trip->update(['water_route_id' => $route->getKey()]);
        });
    }

    public function withBoatType(?BoatType $boatType = null): static
    {
        return $this->afterCreating(function (Trip $trip) use ($boatType): void {
            $type = $boatType ?? BoatType::factory()->create(['program_id' => $trip->program_id]);
            $trip->update(['boat_type_id' => $type->getKey()]);
        });
    }
}
