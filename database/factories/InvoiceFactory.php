<?php

namespace Database\Factories;

/* @var $factory \Illuminate\Database\Eloquent\Factory */

use App\Models\Invoice;
use Faker\Generator as Faker;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class InvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        $subtotal = $this->faker->numberBetween(20, 100);

        return [
            // 'client_id'=>$this->faker->numberBetween(1,20),
            // 'user_id'=>1,
            'invoice_date'=>$this->faker->dateTimeBetween('-4 years'),
            // 'subtotal'=>$subtotal,
            // 'tps'=>$subtotal*0.05,
            // 'tvq'=>$subtotal*0.09975,
            // 'total'=>$subtotal*1.14975,
            'status'=>$this->faker->numberBetween(1, 2),

        ];
    }
}
