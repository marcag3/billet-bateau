<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ChangePaymentAndInvoiceDateToDateTime extends Migration
{
    public function up()
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dateTime('payment_date')->change();
        });
        Schema::table('invoices', function (Blueprint $table) {
            $table->dateTime('invoice_date')->change();
        });
        Schema::table('boat_inventories', function (Blueprint $table) {
            $table->renameColumn('amount', 'quantity');
        });
    }
}
