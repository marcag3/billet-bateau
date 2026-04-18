<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTripsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->dateTime('departure');
            $table->dateTime('arrival');
            $table->unsignedTinyInteger('status');
            $table->unsignedBigInteger('guide_id')->nullable();
            $table->unsignedBigInteger('route_id')->nullable();
            $table->unsignedInteger('number_of_minor')->nullable();
            $table->unsignedInteger('boat_charge')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('trips');
    }
}
