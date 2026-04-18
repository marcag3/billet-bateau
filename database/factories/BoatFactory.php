<?php

namespace Database\Factories;

/* @var $factory \Illuminate\Database\Eloquent\Factory */

use App\Models\Boat;
use App\Models\BoatCategory;
use Faker\Generator as Faker;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class BoatFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'name'=>$this->faker->company(),
            'capacity'=>$this->faker->numberBetween(1, 9),
            'boat_category_id'=>BoatCategory::all()->random()->id,
            'note'=>$this->faker->optional()->realText(100),
        ];
    }
}
