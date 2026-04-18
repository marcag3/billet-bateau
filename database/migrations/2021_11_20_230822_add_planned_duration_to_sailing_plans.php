<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPlannedDurationToSailingPlans extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('sailing_plans', function (Blueprint $table) {
            $table->unsignedInteger('planned_duration')->after('departure')->comment('in minutes')->nullable();
            $table->dateTime('arrival')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('sailing_plans', function (Blueprint $table) {
            //
        });
    }
}
