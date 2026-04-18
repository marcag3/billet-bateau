<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AreaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('areas')->insertOrIgnore([
            [
                'id'=>1,
                'name'=>'Montréal',
                'address' => '4975, boulevard Gouin Est',
                'apartment' => null,
                'city' => 'Montréal',
                'postalCode' => 'H1G 6J9',
                'telephone' => '+1 438-725-2735',
                'email' => 'info@laroutedechamplain.com',
            ],
            [
                'id'=>2,
                'name'=>'Haut-Richelieu',
                'address' => '',
                'apartment' => null,
                'city' => '',
                'postalCode' => '',
                'telephone' => '',
                'email' => 'info@laroutedechamplain.com',
            ],
        ]);
    }
}
