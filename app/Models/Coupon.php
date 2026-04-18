<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Coupon extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $touches = ['client'];

    //Getters

    public function getNameAttribute()
    {
        return $this->promotion->name;
    }

    //Relations

    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function pass()
    {
        return $this->belongsTo(Pass::class, 'pass_id');
    }

    public function invoiceItem()
    {
        return $this->belongsTo(InvoiceItem::class, 'invoice_item_id');
    }

    //Functions

    public function scopeAvailable($query)
    {
        return $query->whereNull('invoice_item_id');
    }

    public static function availableCoupons(Invoice $invoice)
    {
        if ($invoice->invoiceItems->count() == 0) {
            return $promotion = collect();
        }

        if ($invoice->invoiceItems->last()->itemable_type != 'App\Product') {
            return $promotion = collect();
        }

        $coupons = $invoice->client->coupons;

        return $coupons
            ->filter(function ($coupon) { //start_date
                if ($coupon->promotion->start_date == null) {
                    return true;
                } else {
                    return $coupon->promotion->start_date <= today();
                }
            })
            ->filter(function ($coupon) { //end_date
                if ($coupon->promotion->end_date == null) {
                    return true;
                } else {
                    return $coupon->promotion->end_date >= today();
                }
            })
            ->filter(function ($coupon) use ($invoice) { //required product
                if ($coupon->promotion->products_id == null) {
                    return true;
                } elseif ($invoice->invoiceItems->count()) {
                    return
                        collect($coupon->promotion->products_id)
                        ->contains($invoice->invoiceItems->last()->itemable_id);
                } else {
                    return false;
                }
            });
    }
}
