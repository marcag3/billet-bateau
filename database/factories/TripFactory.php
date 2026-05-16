<?php

namespace Database\Factories;

use App\Models\BoatType;
use App\Models\Product;
use App\Models\Program;
use App\Models\Trip;
use App\Models\WaterRoute;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Trip>
 */
class TripFactory extends Factory
{
    protected $model = Trip::class;

    public function configure(): static
    {
        return $this->afterMaking(function (Trip $trip): void {
            if ($trip->product_id !== null && $trip->product_id !== '') {
                return;
            }

            $programId = (string) $trip->program_id;
            $product = Product::factory()->create([
                'program_id' => $programId,
                'name' => 'Bookable product',
                'capacity' => fake()->numberBetween(4, 60),
            ]);
            $trip->product_id = $product->getKey();
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'program_id' => Program::factory(),
            'scheduled_departure_at' => fake()->dateTimeBetween('+1 day', '+2 months'),
        ];
    }

    public function forProgram(Program $program): static
    {
        return $this->state(fn (): array => [
            'program_id' => $program->getKey(),
        ]);
    }

    public function forProduct(Product $product): static
    {
        return $this->state(fn (): array => [
            'program_id' => $product->program_id,
            'product_id' => $product->getKey(),
        ]);
    }

    public function withWaterRoute(?WaterRoute $waterRoute = null): static
    {
        return $this->afterCreating(function (Trip $trip) use ($waterRoute): void {
            $programId = (string) $trip->program_id;
            $product = $trip->product;
            if ($product === null) {
                return;
            }

            if ($waterRoute !== null) {
                if ((string) $waterRoute->program_id !== $programId) {
                    $waterRoute->forceFill(['program_id' => $programId])->save();
                }
                $product->update(['water_route_id' => $waterRoute->getKey()]);

                return;
            }

            $route = WaterRoute::factory()->create([
                'program_id' => $programId,
            ]);
            $product->update(['water_route_id' => $route->getKey()]);
        });
    }

    public function withBoatType(?BoatType $boatType = null): static
    {
        return $this->afterCreating(function (Trip $trip) use ($boatType): void {
            $product = $trip->product;
            if ($product === null) {
                return;
            }

            $type = $boatType ?? BoatType::factory()->create(['program_id' => $trip->program_id]);
            $product->update(['boat_type_id' => $type->getKey()]);
        });
    }
}
