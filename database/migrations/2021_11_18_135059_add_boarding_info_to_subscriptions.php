<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AddBoardingInfoToSubscriptions extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('address')->nullable();
            $table->string('apartment', 10)->nullable();
            $table->string('city', 50)->nullable();
            $table->string('postalCode', 10)->nullable();
            $table->string('telephone', 21)->nullable();
            $table->string('email', 50)->nullable();
            $table->timestamps();
        });
        Artisan::call('db:seed --class=AreaSeeder');

        Schema::create('points_of_sale', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('cookie', 255)->nullable();
            $table->boolean('is_for_client')->default(false);
            $table->foreignId('area_id')->default(1)->constrained();
            $table->string('square_location_id', 255)->nullable();
            $table->timestamps();
        });
        Artisan::call('db:seed --class=PointsOfSaleSeeder');

        Schema::table('routes', function (Blueprint $table) {
            $table->foreignId('area_id')->after('route_url')->default(1)->constrained();
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->boolean('permits_boarding')->after('is_taxable')->default(false);
            $table->json('boat_categories_id')->after('permits_boarding')->nullable();
            $table->boolean('is_rental')->after('boat_categories_id')->nullable();
            $table->unsignedInteger('max_passenger')->after('is_rental')->nullable();
            $table->json('available_points_of_sale_ids')->after('max_passenger')->nullable();
            $table->boolean('is_full_boat')->after('available_points_of_sale_ids')->nullable();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->renameColumn('is_available', 'available_points_of_sale_ids');
            $table->boolean('is_teen')->after('is_child')->default(false);
            $table->boolean('is_adult')->after('is_teen')->default(false);
        });
        Schema::table('products', function (Blueprint $table) {
            $table->json('available_points_of_sale_ids')->nullable()->default(null)->change();
        });
        Artisan::call('makeAvailablePOSArray');

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('point_of_sale_id')->default(3)->after('status')->constrained('points_of_sale');
        });
        DB::table('invoices')->update(['point_of_sale_id'=>1]);

        Artisan::call('db:seed --class=RolesAndPermissionsSeeder');

        Schema::table('client_products', function (Blueprint $table) {
            $table->foreignId('booking_id')->after('remaining_uses')->nullable()
                ->comment('the booking which the product is predicted to be used')->constrained('bookings');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            //
        });
    }
}
