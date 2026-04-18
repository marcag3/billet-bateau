<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RenameCategoriesToBoatCategories extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('boats', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });
        Schema::table('sailing_plans', function (Blueprint $table) {
            $table->dropForeign(['boat_category_id']);
        });
        Schema::table('trips', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        Schema::rename('categories', 'boat_categories');

        Schema::table('boats', function (Blueprint $table) {
            $table->renameColumn('category_id', 'boat_category_id');
            $table->foreign('boat_category_id')->references('id')->on('boat_categories');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('category_id', 'boat_category_id');
            $table->foreign('boat_category_id')->references('id')->on('boat_categories');
        });
        Schema::table('sailing_plans', function (Blueprint $table) {
            $table->foreign('boat_category_id')->references('id')->on('boat_categories');
        });
        Schema::table('trips', function (Blueprint $table) {
            $table->renameColumn('category_id', 'boat_category_id');
            $table->foreign('boat_category_id')->references('id')->on('boat_categories');
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
