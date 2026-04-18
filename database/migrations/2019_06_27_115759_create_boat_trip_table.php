<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBoatTripTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('boat_trip', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('boat_id');
            $table->unsignedBigInteger('trip_id');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('boat_id')->references('id')->on('boats');
            $table->foreign('trip_id')->references('id')->on('trips');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('boat_trip');
    }
}
