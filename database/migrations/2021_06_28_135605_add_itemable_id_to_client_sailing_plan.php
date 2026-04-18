<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddItemableIdToClientSailingPlan extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('client_sailing_plan', function (Blueprint $table) {
            $table->foreignId('itemable_id')->after('sailing_plan_id')->nullable();
            $table->string('itemable_type')->after('itemable_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('client_sailing_plan', function (Blueprint $table) {
            //
        });
    }
}
