<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTaxableFlag extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_taxable')->after('max_passenger');
            $table->boolean('is_rental')->default(null)->change();
            $table->boolean('is_initiation')->default(null)->change();
        });
        DB::table('products')->update(['is_taxable'=>true]);

        Schema::table('promotions', function (Blueprint $table) {
            $table->dropColumn('is_on_invoice_total');
        });
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->boolean('is_taxable')->after('add_promotion');
        });
        DB::table('subscriptions')->update(['is_taxable'=>true]);

        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('non_taxable_subtotal', 13, 4)->default(0)
                ->after('subtotal');
            $table->renamecolumn('subtotal', 'taxable_subtotal');
        });

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->boolean('is_taxable')->after('price');
        });

        DB::table('invoice_items')->update(['is_taxable'=>true]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('is_taxable');
        });
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('is_taxable');
        });
        Schema::table('invoices', function (Blueprint $table) {
            $table->renamecolumn('taxable_subtotal', 'subtotal');
            $table->dropColumn('non_taxable_subtotal');
        });
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn('is_taxable');
        });
    }
}
