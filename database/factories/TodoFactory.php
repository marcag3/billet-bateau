<?php

namespace Database\Factories;

use App\Models\Todo;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Todo>
 */
class TodoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'title' => fake()->sentence(4),
            'completed' => fake()->boolean(20),
        ];
    }
}
