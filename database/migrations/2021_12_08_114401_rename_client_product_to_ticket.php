<?php

use Illuminate\Console\Command;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RenameClientProductToTicket extends Migration
{
    public function up()
    {

        //client_products ==> tickets
        Schema::rename('client_products', 'tickets');
        DB::table('boardings')->where('boarding_item_type', 'ClientProduct')->update(['boarding_item_type'=>'Ticket']);
        $commandStatus = Artisan::call('TransfertSailingPlanIdFromTicketToBoarding');

        if (Schema::hasColumn('tickets', 'sailing_plan_id') && $commandStatus === Command::SUCCESS) {
            Schema::table('tickets', function (Blueprint $table) {
                $table->dropForeign('client_products_sailing_plan_id_foreign');
                $table->dropColumn('sailing_plan_id');
            });
        }

        //client_subscriptions ==> passes

        Schema::table('client_promotions', function (Blueprint $table) {
            $table->dropForeign(['client_subscription_id']);
        });
        Schema::rename('client_subscriptions', 'passes');
        Schema::table('client_promotions', function (Blueprint $table) {
            $table->renameColumn('client_subscription_id', 'pass_id');
            $table->foreign('pass_id')->references('id')->on('passes');
        });
        DB::table('boardings')->where('boarding_item_type', 'ClientSubscription')->update(['boarding_item_type'=>'Pass']);
        Artisan::call('ChangeSubscribeDateToExpiryDate');

        //client_promotions ==> coupons
        Schema::rename('client_promotions', 'coupons');
        Schema::table('coupons', function (Blueprint $table) {
            $table->foreign('promotion_id')->references('id')->on('promotions');
        });
        Artisan::call('ClientPromotionToPromotion');
    }
}
