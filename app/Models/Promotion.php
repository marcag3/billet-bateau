<?php

namespace App\Models;

use Collective\Html\Eloquent\FormAccessible;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Promotion extends Model
{
    use FormAccessible;
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'products_id'=>'json',
        'value' => 'decimal:2',
        'is_percentage'=>'boolean',
        'is_on_client'=>'boolean',
        'is_on_invoice_total'=>'boolean',
    ];
    //Getters

    //Relations

    public function subscriptions()
    {
        return $this->hasMany(\App\Models\Subscription::class, 'add_promotion_id');
    }

    public function coupons()
    {
        return $this->hasMany(\App\Models\Coupon::class, 'promotion_id');
    }

    //Functions

    public function calculatePrice(Invoice $invoice, InvoiceItem $invoiceItem)
    {
        if ($this->is_on_invoice_total) {
            $invoiceItem->price = $this->getDiscount($invoice->total);
            $invoiceItem->save();
        } else {
            if (count($this->products_id) === 0) {
                $product = $invoice->findLatestProduct();
            } else {
                $product = $invoice->findPriciestProduct($this->products_id ?? null);
            }
            if ($product === null) {
                abort(418);
            }
            $invoiceItem->discounted_item_id = $product->id;
            $invoiceItem->price = $this->getDiscount($product->price);
            $invoiceItem->is_taxable = $product->is_taxable;
            $invoiceItem->save();
        }
    }

    private function getDiscount(String $discountedPrice)
    {
        if ($this->is_percentage) {
            return -bcmul($discountedPrice, bcdiv($this->value, 100, 6), 4);
        } else {
            return -min($this->value, $discountedPrice);
        }
    }

    public function scopeAvailable($query)
    {
        return $query->where(function ($query) {
            $query->whereNull('start_date')
                    ->orWhere('start_date', '<=', today());
        })
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', today());
            });
    }

    public static function availablePromotions(Invoice $invoice)
    {
        if ($invoice->invoiceItems->count() == 0) {
            return $promotion = collect();
        }

        if ($invoice->invoiceItems->last()->itemable_type != 'App\Product') {
            return $promotion = collect();
        }

        $promotions = self::where('is_on_client', false)->get();

        return $promotions

            ->filter(function ($promotion) {//start_date
                if ($promotion->start_date == null) {
                    return true;
                } else {
                    return $promotion->start_date <= today();
                }
            })

            ->filter(function ($promotion) { //end_date
                if ($promotion->end_date == null) {
                    return true;
                } else {
                    return $promotion->end_date >= today();
                }
            })
            ->filter(function ($promotion) use ($invoice) { //required products
                if ($promotion->products_id == null) {
                    return true;
                } else {
                    return $invoice->invoiceItems
                        ->where('itemable_type', 'App\Product')
                        ->pluck('itemable_id')
                        ->intersect($promotion->products_id)
                        ->count() > 0;
                }
            });
    }
}
