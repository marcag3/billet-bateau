<?php

use App\ClientProduct;
use Illuminate\Console\Command;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RenameItemableToBoardingItemInClientSailingPlan extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (Schema::hasTable('client_sailing_plan')) {
            Schema::rename('client_sailing_plan', 'boardings');
        }

        if (Schema::hasColumn('boardings', 'itemable_id')) {
            Schema::table('boardings', function (Blueprint $table) {
                $table->renameColumn('itemable_id', 'boarding_item_id');
                $table->renameColumn('itemable_type', 'boarding_item_type');
            });
        }

        if (! Schema::hasColumn('client_products', 'remaining_uses')) {
            Schema::table('client_products', function (Blueprint $table) {
                $table->unsignedInteger('remaining_uses')->default(1)->after('sailing_plan_id');
            });
            //set the actual client_product to 0 remaining uses
            DB::table('client_products')->update(['remaining_uses'=>0]);
        }

        if (! Schema::hasColumn('clients', 'parent_id')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->string('identification_card_number', 100)->nullable()->after('initiation_trip');
                $table->unsignedTinyInteger('identification_card_type')->nullable()->after('identification_card_number');
                $table->foreignId('parent_id')->after('identification_card_type')->nullable();
                $table->renameColumn('initiation_trip', 'initiation_sailing_plan_id');
            });
            Schema::table('clients', function (Blueprint $table) {
                $table->foreign('parent_id')->references('id')->on('clients');
                $table->foreign('initiation_sailing_plan_id')->references('id')->on('sailing_plans');
            });
        }
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
