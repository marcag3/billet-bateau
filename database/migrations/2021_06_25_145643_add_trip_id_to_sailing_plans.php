<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTripIdToSailingPlans extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('sailing_plans', function (Blueprint $table) {
            $table->foreignId('trip_id')->after('route_id')->nullable()->constrained();
            $table->foreignId('boat_category_id')->after('trip_id')->nullable()->constrained('categories');
            $table->unsignedInteger('number_of_passengers')->after('boat_category_id')->nullable();
            $table->foreignId('guide_id')->change()->constrained('users');
            $table->renameColumn('number_of_minor', 'number_of_children');
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
