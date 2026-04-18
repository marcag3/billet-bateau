<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddMinimumBookingPersonToBoatCategories extends Migration
{
    public function up()
    {
        Schema::table('boat_categories', function (Blueprint $table) {
            $table->unsignedInteger('minimum_booking_person')->default(1)->after('child_capacity');
            $table->string('description_fr', 500)->nullable()->after('minimum_booking_person');
            $table->string('description_en', 500)->nullable()->after('description_fr');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_available')->after('is_child')->default(true);
            $table->boolean('is_full_boat')->after('is_available')->default(true);
        });
        Schema::table('bookings', function (Blueprint $table) {
            $table->boolean('is_full_boat')->after('note')->default(true);
            $table->unsignedInteger('number_of_boats')->after('is_full_boat')->nullable();
        });
    }
}
