<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PointsOfSaleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('points_of_sale')->upsert(
            [
                [
                    'id'=>1,
                    'name' => 'Aimé-Leonard',
                    'is_for_client'=>false,
                    'area_id'=>1,
                    'square_location_id'=>'LP338S616W87M',

                ],
                [
                    'id' => 2,
                    'name' => "Plage de l'est",
                    'is_for_client'=>false,
                    'area_id'=>1,
                    'square_location_id'=>'LP338S616W87M',

                ],
                [
                    'id'=>3,
                    'name' => 'Internet Montréal',
                    'is_for_client'=>true,
                    'area_id'=>1,
                    'square_location_id'=>'LP338S616W87M',
                ],
                [
                    'id'=>4,
                    'name' => 'Internet Haut-Richelieu',
                    'is_for_client'=>true,
                    'area_id'=>2,
                    'square_location_id'=>'LP338S616W87M',

                ],
            ],
            ['id'],
            ['name', 'is_for_client', 'area_id']
        );
    }
}
