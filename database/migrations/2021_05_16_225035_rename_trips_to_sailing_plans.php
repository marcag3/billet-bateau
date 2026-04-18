<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RenameTripsToSailingPlans extends Migration
{
    /*
    Future trip table will look like that: (GTFS baby!)
    $table->id();
    $table->foreignId('route_id')->nullable()->constrained();
    $table->foreignId('service_id')->nullable()->constrained();
    $table->boolean('direction_id')->nullable();
    $table->foreignId('block_id')->nullable()->constrained();
    $table->foreignId('shape_id')->nullable()->constrained();
    $table->tinyInteger('wheelchair_accessible')->nullable();
    $table->smallInteger('bikes_allowed')->nullable();
    $table->timestamps();
    */

    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('client_trip', function (Blueprint $table) {
            $table->dropForeign(['trip_id']);
        });
        Schema::table('boat_trip', function (Blueprint $table) {
            $table->dropForeign(['trip_id']);
        });

        Schema::rename('trips', 'sailing_plans');
        Schema::rename('client_trip', 'client_sailing_plan');
        Schema::rename('boat_trip', 'boat_sailing_plan');

        Schema::table('client_sailing_plan', function (Blueprint $table) {
            $table->renameColumn('trip_id', 'sailing_plan_id');
            $table->foreign('sailing_plan_id')->references('id')->on('sailing_plans');
        });
        Schema::table('boat_sailing_plan', function (Blueprint $table) {
            $table->renameColumn('trip_id', 'sailing_plan_id');
            $table->foreign('sailing_plan_id')->references('id')->on('sailing_plans');
        });
        Schema::table('client_products', function (Blueprint $table) {
            $table->renameColumn('trip_id', 'sailing_plan_id');
            $table->foreign('sailing_plan_id')->references('id')->on('sailing_plans');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
    }
}
