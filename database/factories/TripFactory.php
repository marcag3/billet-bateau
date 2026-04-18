<?php

namespace Database\Factories;

use App\Models\Trip;
use Illuminate\Database\Eloquent\Factories\Factory;

class TripFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'route_id'=>$this->faker->numberBetween(1, 2),
            'service_id'=>$this->faker->numberBetween(1, 2),
            'boat_category_id'=>$this->faker->numberBetween(1, 3),
            'start_time'=>$this->faker->numberBetween(9, 19).':'.$this->faker->numberBetween(0, 59),
        ];
    }
}
