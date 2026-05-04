<?php

namespace Database\Factories;

use App\Models\BoatType;
use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BoatType>
 */
class BoatTypeFactory extends Factory
{
    protected $model = BoatType::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'program_id' => Program::factory(),
            'name' => fake()->words(2, true),
        ];
    }
}
