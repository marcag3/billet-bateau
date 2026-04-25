<?php

namespace Database\Factories;

use App\Models\Program;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Program>
 */
class ProgramFactory extends Factory
{
    protected $model = Program::class;

    public function configure(): static
    {
        return $this->afterCreating(function (Program $program): void {
            if ($program->user_id !== null) {
                $program->users()->syncWithoutDetaching([(int) $program->user_id]);
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->paragraph(),
            'theme_color' => '#'.strtoupper(fake()->regexify('[0-9A-F]{6}')),
            'is_active' => false,
            'is_archived' => false,
            'slug' => function (array $attributes): string {
                $id = (string) ($attributes['id'] ?? Str::uuid());

                return 'p-'.Str::lower(substr(str_replace('-', '', $id), 0, 16));
            },
        ];
    }
}
