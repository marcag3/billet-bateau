<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddGuidedToTripsAndCreateBoatInventory extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('boat_inventories', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 255);
            $table->foreignId('boat_category_id')->constrained();
            $table->unsignedInteger('amount');
            $table->timestamps();
        });
        Schema::table('trips', function (Blueprint $table) {
            $table->foreignId('boat_inventory_id')->after('boat_category_id')->nullable()->constrained();
            $table->unsignedTinyInteger('guided')->after('start_time')->default(2);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('trips', function (Blueprint $table) {
            //
        });
    }
}
