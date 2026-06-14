<?php

namespace Database\Factories;

use App\Models\Program;
use App\Models\TemplateDay;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TemplateDay>
 */
class TemplateDayFactory extends Factory
{
    protected $model = TemplateDay::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'program_id' => Program::factory(),
            'name' => fake()->words(3, true),
        ];
    }

    public function forProgram(Program $program): static
    {
        return $this->state(fn (): array => [
            'program_id' => $program->getKey(),
        ]);
    }
}
