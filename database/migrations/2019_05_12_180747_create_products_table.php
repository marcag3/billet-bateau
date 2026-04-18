<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->char('name', 50);
            $table->decimal('price', 13, 4);
            $table->unsignedBigInteger('category_id')->nullable();
            $table->boolean('is_rental')->default(false);
            $table->boolean('is_initiation')->default(false);
            $table->unsignedBigInteger('required_subscription_id')->nullable();
            $table->json('required_products_id')->nullable();
            $table->json('replace_products_id')->nullable();
            $table->unsignedInteger('max_passenger');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('category_id')->references('id')->on('categories');
            $table->foreign('required_subscription_id')->references('id')->on('subscriptions');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('products');
    }
}
