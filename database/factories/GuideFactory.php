<?php

namespace Database\Factories;

use App\Models\Guide;
use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Guide>
 */
class GuideFactory extends Factory
{
    protected $model = Guide::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'program_id' => Program::factory(),
            'name' => fake()->name(),
            'staff_user_id' => null,
        ];
    }
}
