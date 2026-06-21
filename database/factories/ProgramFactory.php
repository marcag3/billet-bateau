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
            // Subclasses or states are responsible for attaching users via pivot.
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'name' => fake()->words(3, true),
            'description' => fake()->optional()->paragraph(),
            'theme_color' => '#'.strtoupper(fake()->regexify('[0-9A-F]{6}')),
            'is_active' => true,
            'slug' => function (array $attributes): string {
                $id = (string) ($attributes['id'] ?? Str::ulid());

                return 'p-'.Str::lower(substr(str_replace('-', '', $id), 0, 16));
            },
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->addMonths(6)->endOfMonth()->toDateString(),
            'booking_questions' => [],
            'timezone' => 'America/Toronto',
        ];
    }

    /**
     * Attach an owner user via the program_user pivot after creation.
     */
    public function withOwner(User $user): static
    {
        return $this->afterCreating(function (Program $program) use ($user): void {
            $program->users()->attach($user->getKey(), ['role' => 'owner']);
        });
    }
}
