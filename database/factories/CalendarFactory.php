<?php

namespace Database\Factories;

use App\Models\Calendar;
use Illuminate\Database\Eloquent\Factories\Factory;

class CalendarFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'name' => $this->faker->unique()->lastname(),
            'monday' => $this->faker->boolean(),
            'tuesday' => $this->faker->boolean(),
            'wednesday' => $this->faker->boolean(),
            'thursday' => $this->faker->boolean(),
            'friday' => $this->faker->boolean(),
            'saturday' => $this->faker->boolean(),
            'sunday' => $this->faker->boolean(),
            'start_date' => date_format($this->faker->dateTimeBetween('-1 year', 'now'), 'Y-m-d'),
            'end_date' => date_format($this->faker->dateTimeBetween('+1 day', '+1 year'), 'Y-m-d'),
        ];
    }
}
