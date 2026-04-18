<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateScheduleTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('routes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->tinyInteger('route_type')->default(4); //Ferry
            $table->string('route_url')->default('')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('stops', function (Blueprint $table) {
            $table->id();
            $table->string('code', 255)->nullable();
            $table->string('name', 255)->nullable();
            $table->decimal('lat', 9, 6);
            $table->decimal('long', 9, 6);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained();
            $table->foreignId('service_id')->constrained('calendars');
            $table->foreignId('category_id')->constrained();
            $table->time('start_time');
            $table->timestamps();
            $table->softDeletes();
        });
        Schema::create('route_stops', function (Blueprint $table) {
            $table->id();
            $table->foreignId('route_id')->constrained();
            $table->foreignId('stop_id')->constrained();
            $table->integer('stop_sequence');
            $table->integer('arrival_minutes');
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
        //
    }
}
