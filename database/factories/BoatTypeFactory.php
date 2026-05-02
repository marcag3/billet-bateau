<?php

namespace Database\Factories;

use App\Models\BoatType;
use App\Models\Program;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BoatType>
 */
class BoatTypeFactory extends Factory
{
    protected $model = BoatType::class;

    public function configure(): static
    {
        return $this->afterCreating(function (BoatType $boatType): void {
            $program = Program::query()->whereKey($boatType->program_id)->first();

            if ($program === null) {
                return;
            }

            $program->users()->syncWithoutDetaching([(int) $boatType->user_id]);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'user_id' => User::factory(),
            'program_id' => Program::factory(),
            'name' => fake()->words(2, true),
        ];
    }
}
