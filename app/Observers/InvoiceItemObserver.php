<?php

namespace App\Observers;

use App\Models\InvoiceItem;

class InvoiceItemObserver
{
    //deleting client products and promotion that had been added temporarily from a draft invoice
    //should not need that anymore since we do not add temporary subscription, promotions and product
    // to the client before confirming the invoice
    //a confirmed invoice should be set in stone . To remove an item, we would need to make a new invoice
    //with a negative number of item
    public function deleting(InvoiceItem $invoiceItem)
    {

        //TODO:
        // dump('in event deleting invoiceItem');
        // if ($invoiceItem->pass) {
        //     $invoiceItem->pass->delete();
        //     flash('Abonnement du client enlevé');
        // } elseif ($invoiceItem->coupon) {
        //     $invoiceItem->coupon->invoiceItem()->dissociate()->save();
        //     flash('Promotion du client enlevée');
        // } elseif ($invoiceItem->ticket) {
        //     $invoiceItem->ticket->delete();
        //     flash('Produit du client enlevé');
        // }
    }
}
