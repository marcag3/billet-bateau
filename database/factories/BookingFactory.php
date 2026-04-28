<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    protected $model = Booking::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'program_id' => Program::factory(),
            'contact_name' => fake()->name(),
            'contact_email' => fake()->safeEmail(),
        ];
    }

    public function forProgram(Program $program): static
    {
        return $this->state(fn (): array => [
            'program_id' => $program->getKey(),
        ]);
    }
}
