<?php

namespace App\Observers;

use App\Models\Coupon;
use App\Models\Invoice;
use App\Jobs\SendInvoice as JobsSendInvoice;
use App\Notifications\SendInvoice;
use App\Models\Pass;
use App\Models\Ticket;

class InvoiceObserver
{
    public function saved(Invoice $invoice)
    {
        //add the products, the subscriptions, remove or add the promotions to the client
        //will run only when status change from draft to confirmed
        if ($invoice->status === Invoice::CONFIRMED && $invoice->getOriginal('status') === Invoice::DRAFT) {
            $client = $invoice->client;
            if ($client->email) {
                JobsSendInvoice::dispatchAfterResponse($invoice);
            }

            foreach ($invoice->invoiceItems as $item) {
                //TODO: negative number of items

                if ($item->itemable_type === 'App\Product') {
                    $client->products()->attach(
                        array_fill(0, $item->number_of_items, $item->itemable_id),
                        ['invoice_item_id'=>$item->id]
                    );
                } elseif ($item->itemable_type === 'App\Subscription') {
                    //we cannot use the add subscriptions to the client via attach function because the saving
                    //event for client subscriptions will not be fired
                    if ($item->number_of_items > 0) {
                        for ($i = 0; $i < $item->number_of_items; $i++) {
                            $client->passes()->create([
                                'subscription_id'=>$item->itemable_id,
                                'invoice_item_id'=>$item->id,
                                'expiry_date'=>$item->itemable->expiration_date,
                            ]);
                        }
                    }
                } elseif ($item->itemable_type === 'App\Promotion') {
                    //find the corresponding client promotion and update the invoice item id
                    $promotion = $item->itemable;
                    if ($promotion->is_on_client) {
                        $coupon = $client->coupons()
                            ->where('promotion_id', $promotion->id)
                            ->first();
                        $item->coupon()->save($coupon);
                    }
                }
            }
        } elseif ($invoice->status === Invoice::DRAFT && $invoice->getOriginal('status') === Invoice::CONFIRMED) {
            $invoiceItemsIds = $invoice->invoiceItems->pluck('id');
            Ticket::whereIn('invoice_item_id', $invoiceItemsIds)->forceDelete();
            Pass::whereIn('invoice_item_id', $invoiceItemsIds)->forceDelete();
            Coupon::whereIn('invoice_item_id', $invoiceItemsIds)->update(['invoice_item_id'=>null]);
        }
    }

    public function deleting(Invoice $invoice)
    {
        foreach ($invoice->invoiceItems as $invoiceItem) {
            $invoiceItem->delete();
        }
    }
}
