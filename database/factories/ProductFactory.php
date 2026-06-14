<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

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
            'capacity' => fake()->numberBetween(4, 60),
            'name' => fake()->words(2, true),
            'description' => null,
        ];
    }

    public function forProgram(Program $program): static
    {
        return $this->state(fn (): array => [
            'program_id' => $program->getKey(),
        ]);
    }
}
