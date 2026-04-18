<?php

namespace Database\Seeders;

use App\Models\Boat;
use App\Models\Calendar;
use App\Models\Client;
use App\Models\Pass;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            AreaSeeder::class,
            PointsOfSaleSeeder::class,
            DefaultDataSeeder::class,
            RolesAndPermissionsSeeder::class,

        ]);

        DB::table('users')->insert([
            'name'=>'Admin',
            'email'=>'admin@example.com',
            'email_verified_at'=> '2021-01-10 16:54:16',
            'password'=>'$2y$10$KTBdBKtOdS73CWhql.QYNOGOzOSQZrzztClAT6MZ7r5SuHtkelrKK',

        ]);

        User::first()->assignRole('Chancelier Suprême');

        Client::factory()->count(2000)->create();

        Pass::factory()->count(20)->create();

        // Boat::factory()->count(20)->create();

        $this->call([
            ScheduleSeeder::class,
            InvoiceSailingPlanSeeder::class,
        ]);
    }
}
