<?php

namespace Database\Factories;

use App\Models\Pass;
use Faker\Generator as Faker;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PassFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'subscription_id' => $this->faker->numberBetween(1, 3),
            'client_id'=>$this->faker->numberBetween(1, 20),
            'expiry_date'=>$this->faker->dateTimeBetween('-1 years', '+1 years'),

        ];
    }
}
