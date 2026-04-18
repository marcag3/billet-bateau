<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CreateConfigsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->datetime('sent_at')->after('point_of_sale_id')->nullable();
        });
        Schema::create('configs', function (Blueprint $table) {
            $table->string('key', 255)->unique()->primary();
            $table->string('value', 255)->nullable();
            $table->timestamps();
        });
        DB::table('configs')->insert([
            [
                'key'=>'TPS_number',
                'value'=>'tps number',
            ],
            [
                'key'=>'TPS_rate',
                'value'=>'0.05',
            ],
            [
                'key'=>'TVQ_number',
                'value'=>'tvq number',
            ],
            [
                'key'=>'TVQ_rate',
                'value'=>'0.09975',
            ],
            [
                'key'=>'fiscal_year_end_day',
                'value'=>'31',
            ],
            [
                'key'=>'fiscal_year_end_month',
                'value'=>'12',
            ],
            [
                'key'=>'square_app_id',
                'value'=>'sandbox-sq0idb-dXJinaKqsnVyBg7o3Mht8Q',
            ],
        ]);
        Artisan::call('db:seed --class=RolesAndPermissionsSeeder');
    }
}
