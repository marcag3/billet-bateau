<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateClientPromotionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('client_promotions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('promotion_id');
            $table->unsignedBigInteger('client_subscription_id')->nullable();
            $table->unsignedBigInteger('invoice_item_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('client_subscription_id')->references('id')->on('client_subscriptions')
                ->onDelete('cascade');
            $table->foreign('invoice_item_id')->references('id')->on('invoice_items')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('client_promotions');
    }
}
