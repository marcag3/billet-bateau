<?php

namespace Database\Factories;

use App\Models\TemplateDay;
use App\Models\TemplateDaySlot;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TemplateDaySlot>
 */
class TemplateDaySlotFactory extends Factory
{
    protected $model = TemplateDaySlot::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'template_day_id' => TemplateDay::factory(),
            'sort_order' => 0,
            'departure_time' => '09:30:00',
            'capacity' => fake()->numberBetween(4, 60),
            'boat_type_id' => null,
            'water_route_id' => null,
        ];
    }

    public function forTemplateDay(TemplateDay $templateDay): static
    {
        return $this->state(fn (): array => [
            'template_day_id' => $templateDay->getKey(),
        ]);
    }
}
