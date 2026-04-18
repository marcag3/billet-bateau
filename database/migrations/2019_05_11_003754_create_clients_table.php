<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class CreateClientsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('firstName', 50);
            $table->string('name', 50);
            $table->string('address')->nullable();
            $table->string('apartment', 10)->nullable();
            $table->string('city', 50)->nullable();
            $table->string('postalCode', 10)->nullable();
            $table->string('homephone', 21)->nullable();
            $table->string('cellphone', 21)->nullable();
            $table->string('email', 50)->nullable();
            $table->date('birthday')->nullable();
            $table->string('emergencyContact', 50)->nullable();
            $table->string('emergencyPhone', 21)->nullable();
            $table->text('note')->nullable();
            $table->unsignedBigInteger('initiation_trip')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('clients');
    }
}
