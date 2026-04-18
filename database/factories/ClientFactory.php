<?php

namespace Database\Factories;

use App\Models\Client;
use Faker\Generator as Faker;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ClientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'firstName' => $this->faker->firstname(),
            'name' => $this->faker->lastname(),
            'address'=>$this->faker->numberBetween(0, 3) === 0 ? null : $this->faker->buildingNumber().' '.$this->faker->streetName(),
            'apartment'=>$this->faker->optional()->randomNumber(3, false),
            'city'=>$this->faker->optional()->city(),
            'postalCode'=>$this->faker->optional()->regexify('[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ] [0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]'),
            'homephone'=>$this->faker->optional()->regexify('(\+1 )?(\d{3}[-]){2}(\d{4})( [x]\d{3,6})?'),
            'cellphone'=>$this->faker->optional()->regexify('(\+1 )?(\d{3}[-]){2}(\d{4})( [x]\d{3,6})?'),
            'email' => $this->faker->numberBetween(0, 3) === 0 ? null : $this->faker->unique()->email(),
            'birthday'=>$this->faker->optional()->date(),
            'emergencyContact'=>$this->faker->name(),
            'emergencyPhone'=>$this->faker->regexify('(\+1 )?(\d{3}[-]){2}(\d{4})( [x]\d{3,6})?'),
            'note'=>$this->faker->optional()->text(),
            'identification_card_type'=>$this->faker->optional()->numberBetween(1, 2),
            'identification_card_number'=>$this->faker->optional()->uuid(),
        ];
    }

    public function allBasicInfo()
    {
        return $this->state(function (array $attributes) {
            return [
                'cellphone'=>$this->faker->regexify('(\+1 )?(\d{3}[-]){2}(\d{4})( [x]\d{3,6})?'),
                'emergencyContact'=>$this->faker->name(),
                'emergencyPhone'=>$this->faker->regexify('(\+1 )?(\d{3}[-]){2}(\d{4})( [x]\d{3,6})?'),
            ];
        });
    }

    public function allRentInfo()
    {
        return $this->state(function (array $attributes) {
            return [
                'cellphone'=>$this->faker->regexify('(\+1 )?(\d{3}[-]){2}(\d{4})( [x]\d{3,6})?'),
                'emergencyContact'=>$this->faker->name(),
                'emergencyPhone'=>$this->faker->regexify('(\+1 )?(\d{3}[-]){2}(\d{4})( [x]\d{3,6})?'),
                'identification_card_type'=>$this->faker->numberBetween(1, 2),
                'identification_card_number'=>$this->faker->uuid(),
            ];
        });
    }
}
