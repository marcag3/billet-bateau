<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InvoiceSailingPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('invoices')->insertOrIgnore([
            [
                'id'=>1,
                'client_id' => 1,
                'user_id' => 1,
                'invoice_date' => today(),
                'taxable_subtotal' => 0,
                'non_taxable_subtotal' => 20,
                'tps' => 0,
                'tvq' => 0,
                'total' => 20,
                'status' => '2',
                'point_of_sale_id'=>1,
            ],
        ]);
        DB::table('invoice_items')->insertOrIgnore([
            [
                'id'=>1,
                'invoice_id' => 1,
                'itemable_id' => 1,
                'itemable_type' => 'App\Subscription',
                'price' => 20,
                'is_taxable' => 0,
                'discounted_item_id' => null,
            ],
            [
                'id'=>2,
                'invoice_id' => 1,
                'itemable_id' => 5,
                'itemable_type' => 'App\Product',
                'price' => 15,
                'is_taxable' => 1,
                'discounted_item_id' => null,
            ],
            [
                'id'=>3,
                'invoice_id' => 1,
                'itemable_id' => 1,
                'itemable_type' => 'App\Promotion',
                'price' => -15,
                'is_taxable' => 1,
                'discounted_item_id' => 2,
            ],
        ]);
        DB::table('passes')->insertOrIgnore([
            [
                'id'=>21,
                'subscription_id' => 1,
                'client_id' => 1,
                'expiry_date' => today()->addDays(300),
                'invoice_item_id' => 1,
            ],
        ]);
        DB::table('tickets')->insertOrIgnore([
            [
                'id'=>1,
                'client_id' => 1,
                'product_id' => 5,
                'invoice_item_id' => 2,
            ],
        ]);
        DB::table('coupons')->insertOrIgnore([
            [
                'id'=>1,
                'client_id' => 1,
                'promotion_id' => 1,
                'pass_id' => 21,
                'invoice_item_id' => 3,
            ],
        ]);
        DB::table('sailing_plans')->insertOrIgnore([
            [
                'id'=>1,
                'departure' => '2021-06-28 11:00:00',
                'planned_duration'=>60,
                'arrival' => '2021-06-28 12:00:00',
                'status' => 3,
                'guide_id' => 1,
                'route_id' => 1,
                'boat_category_id' => 1,
                'number_of_passengers' => 1,
                'number_of_children' => 0,
                'user_id' => 1,
            ],
        ]);

        DB::table('boardings')->insertOrIgnore([
            [
                'id'=>1,
                'client_id' => 1,
                'sailing_plan_id' => 1,
                'boarding_item_id' => 1,
                'boarding_item_type' => 'Ticket',

            ],
        ]);
    }
}
