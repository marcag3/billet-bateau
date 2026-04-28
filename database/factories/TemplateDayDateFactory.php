<?php

namespace Database\Factories;

use App\Models\Program;
use App\Models\TemplateDay;
use App\Models\TemplateDayDate;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TemplateDayDate>
 */
class TemplateDayDateFactory extends Factory
{
    protected $model = TemplateDayDate::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::ulid(),
            'template_day_id' => TemplateDay::factory(),
            'service_date' => fake()->date(),
        ];
    }

    protected function configure(): static
    {
        return $this->afterMaking(function (TemplateDayDate $model): void {
            $templateDayId = $model->template_day_id;
            if ($templateDayId === null) {
                return;
            }

            $templateDay = $templateDayId instanceof TemplateDay
                ? $templateDayId
                : TemplateDay::query()->find($templateDayId);

            if ($templateDay instanceof TemplateDay) {
                $model->program_id = $templateDay->program_id;
                $model->template_day_id = $templateDay->getKey();
            }
        });
    }

    public function forTemplateDay(TemplateDay $templateDay): static
    {
        return $this->state(fn (): array => [
            'program_id' => $templateDay->program_id,
            'template_day_id' => $templateDay->getKey(),
        ]);
    }

    public function forProgram(Program $program): static
    {
        return $this->state(fn (): array => [
            'program_id' => $program->getKey(),
            'template_day_id' => TemplateDay::factory()->forProgram($program),
        ]);
    }
}
