<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTeensCapacityToBookingsAndBoatCategory extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->unsignedInteger('number_of_teens')->after('number_of_adults')->nullable();
        });
        Schema::table('boat_categories', function (Blueprint $table) {
            $table->unsignedInteger('teen_capacity')->after('total_capacity')->nullable();
        });
        Schema::table('sailing_plans', function (Blueprint $table) {
            $table->unsignedInteger('number_of_teens')->after('number_of_passengers')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('bookings_and_boat_category', function (Blueprint $table) {
            //
        });
    }
}
