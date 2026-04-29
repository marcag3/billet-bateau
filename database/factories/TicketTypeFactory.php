<?php

namespace Database\Factories;

use App\Models\Program;
use App\Models\TicketType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TicketType>
 */
class TicketTypeFactory extends Factory
{
    protected $model = TicketType::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'program_id' => Program::factory(),
            'title' => fake()->words(2, true),
            'price_cents' => fake()->numberBetween(500, 25000),
            'is_pay_what_you_can' => false,
            'min_per_purchase' => 0,
            'max_per_purchase' => fake()->numberBetween(1, 10),
            'trip_inventory_caps' => [],
        ];
    }
}
