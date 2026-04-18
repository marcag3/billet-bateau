<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class MakeNumberOfPassengersDefaultToZero extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('sailing_plans', function (Blueprint $table) {
            $table->integer('number_of_passengers')->default(0)->change();
            $table->integer('number_of_teens')->default(0)->change();
            $table->integer('number_of_children')->default(0)->change();
        });
    }
}
