<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSubscriptionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->decimal('price', 13, 4);
            $table->integer('duration')->unsigned();
            $table->unsignedBigInteger('add_promotion')->nullable()->default(null); //promotion to add to the client
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('add_promotion')->references('id')->on('promotions');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('subscriptions');
    }
}

//  `DATE_INSCRIPTION` date DEFAULT NULL,
//  `DATE_KAYAK_ILL` date DEFAULT NULL,
//  `TYPE_KAYAK_ILL` int(1) DEFAULT NULL
