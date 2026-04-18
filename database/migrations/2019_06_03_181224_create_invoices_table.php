<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInvoicesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('user_id');
            $table->date('invoice_date')->default(today());
            $table->decimal('subtotal', 13, 4)->default(0);
            $table->decimal('tps', 13, 4)->default(0);
            $table->decimal('tvq', 13, 4)->default(0);
            $table->decimal('total', 13, 4)->default(0);
            $table->unsignedTinyInteger('status')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('client_id')->references('id')->on('clients')
                ->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('invoices');
    }
}

//  `group_id` int(11) NOT NULL,
//  `due_at` date NOT NULL,
//  `number` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
//  `terms` text COLLATE utf8_unicode_ci,
//  `footer` text COLLATE utf8_unicode_ci,
//  `url_key` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
//  `currency_code` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
//  `exchange_rate` decimal(10,7) NOT NULL DEFAULT '1.0000000',
//  `template` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
//  `summary` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
//  `viewed` tinyint(1) NOT NULL DEFAULT '0',
//  `discount` decimal(15,2) NOT NULL DEFAULT '0.00',
//  `company_profile_id` int(11) NOT NULL,
