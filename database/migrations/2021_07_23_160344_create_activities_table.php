<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateActivitiesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('description_fr', 1000)->nullable();
            $table->string('description_en', 1000)->nullable();
            $table->string('rules_fr', 3000)->nullable();
            $table->string('rules_en', 3000)->nullable();
            $table->timestamps();
        });
        Schema::table('boat_categories', function (Blueprint $table) {
            $table->foreignId('activity_id')->after('description_en')->nullable()->constrained();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('activities');
    }
}
