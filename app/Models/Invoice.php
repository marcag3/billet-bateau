<?php

namespace App\Models;

use App\Models\Client;
use App\Models\Coupon;
use App\Models\InvoiceItem;
use App\Models\Pass;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Subscription;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;

class Invoice extends Model
{
    use softDeletes;
    use HasFactory;

    public $guarded = [];

    // protected $with= [
    //     'client.passes',
    //     'user',
    //     'invoiceItems',
    //     'invoicePayments',
    //     'tickets'
    //     // 'coupons',
    //     // 'passes',
    //     // 'tickets',
    // ];
    protected $appends = [
        'client_name',
        'user_name',
        'invoice_date_formatted',
        'status_formatted',
        'due_amount',
    ];

    protected $casts = [
        'invoice_date' => 'datetime',
        'sent_at' => 'datetime',
        'taxable_subtotal' => 'decimal:2',
        'non_taxable_subtotal' => 'decimal:2',
        'tps' => 'decimal:2',
        'tvq' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $touches = ['client'];

    public const DRAFT = 1;

    public const CONFIRMED = 2;

    //Getters
    public function getDisplayNameAttribute()
    {
        $tempCollection = collect([
            $this->client_name,
            $this->invoice_date_formatted,
        ]);
        if ($this->deleted_at !== null) {
            $tempCollection->push('ANNULÉ');
        }

        return $tempCollection->join(', ');
    }

    public function getClientNameAttribute()
    {
        return $this->client->fullName;
    }

    public function getUserNameAttribute()
    {
        return $this->user->name;
    }

    public function getInvoiceDateFormattedAttribute()
    {
        return $this->invoice_date->isoformat('ll');
    }

    public function getStatusFormattedAttribute()
    {
        return config('enums.invoice_status.'.$this->status);
    }

    public function getDueAmountAttribute()
    {
        $total = $this->total;

        return $this->invoicePayments->reduce(function ($due, $invoicePayment) use ($total) {
            return bcsub($due, $invoicePayment->amount, 2);
        }, $total);
    }

    public function getIsConfirmedAttribute()
    {
        return $this->status === self::CONFIRMED;
    }

    public function getIsDraftAttribute()
    {
        return $this->status === self::DRAFT;
    }

    //relations
    public function invoiceItems()
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class)->withDefault(['firstName' => 'CLIENT', 'name' => 'SUPPRIMÉ']);
    }

    public function user()
    {
        return $this->belongsTo(User::class)->withDefault();
    }

    public function passes()
    {
        return $this->hasManyThrough(Pass::class, InvoiceItem::class);
    }

    public function coupons()
    {
        return $this->hasManyThrough(Coupon::class, InvoiceItem::class);
    }

    public function invoicePayments()
    {
        return $this->hasMany(InvoicePayment::class);
    }

    public function payments()
    {
        return $this->belongsToMany(Payment::class, 'invoice_payment');
    }

    public function tickets()
    {
        return $this->hasManyThrough(Ticket::class, InvoiceItem::class);
    }

    public function products()
    {
        return $this->morphedByMany(Product::class, 'itemable', 'invoice_items')->withPivot('price', 'is_taxable')->withTimestamps();
    }

    public function subscriptions()
    {
        return $this->morphedByMany(Subscription::class, 'itemable', 'invoice_items')->withPivot('price', 'is_taxable')->withTimestamps();
    }

    public function promotions()
    {
        return $this->morphedByMany(Promotion::class, 'itemable', 'invoice_items')->withPivot('price', 'is_taxable')->withTimestamps();
    }

    public function pointOfSale()
    {
        return $this->belongsTo(PointOfSale::class);
    }

    //functions

    public function syncItems(array $invoiceItems)
    {
        $products = [];
        $subscriptions = [];
        $promotions = [];
        //TODO: use cache to retrieve products and subscriptions
        //TODO: negative number of items
        foreach ($invoiceItems as $item) {
            if ($item['itemable_type'] === 'App\Product') {
                $product = Product::find($item['itemable_id']);
                $products[$item['itemable_id']] = ['price'=>$product->price, 'is_taxable'=>$product->is_taxable, 'number_of_items'=>$item['number_of_items']];
            } elseif ($item['itemable_type'] === 'App\Subscription') {
                $subscription = Subscription::find($item['itemable_id']);
                $subscriptions[$item['itemable_id']] = ['price'=>$subscription->price, 'is_taxable'=>$subscription->is_taxable, 'number_of_items'=>$item['number_of_items']];
            } elseif ($item['itemable_type'] === 'App\Promotion') {
                $promotion = Promotion::find($item['itemable_id']);
                //price will be calculated after
                $promotions[$item['itemable_id']] = ['price'=>0, 'is_taxable'=>0, 'number_of_items'=>$item['number_of_items']];
            }
        }
        $this->products()->sync($products);
        $this->subscriptions()->sync($subscriptions);
        $this->promotions()->sync($promotions);
        $this->save(); //to save possible modification made before refreshing
        $this->refresh(); //to update the newly created invoiceitems
        $this->invoiceItems
        ->where('itemable_type', 'App\Promotion')
        ->each(function ($invoiceItem) {
            $invoiceItem->itemable->calculatePrice($this, $invoiceItem);
        });
        $this->updateTotals();
        $this->save(); //save the calculated taxes and total
    }

    public function syncInvoicePayments(array $invoicePayments)
    {
        $toSync = [];
        foreach ($invoicePayments as $invoicePayment) {
            $toSync[$invoicePayment['payment_id']] = ['amount'=>$invoicePayment['amount']];
        }
        $this->payments()->sync($toSync);
        $this->refresh(); //to update the newly created invoice payments
    }

    private function updateTotals()
    {
        if ($this->client === null) {
            return false;
        }
        $this->sumSubTotal();
        $this->calculateTaxes();
        $this->sumTotal();
        $this->calculateInvoicePromotion();
    }

    private function sumSubTotal()
    {
        $this->taxable_subtotal = 0;
        $this->non_taxable_subtotal = 0;
        $this->invoiceItems->each(function ($invoiceItem) {
            if ($invoiceItem->itemable_type === 'App\Promotion' && $invoiceItem->discounted_item_id === null) {
                // dump('found a promotion with no discounted item id');
                //don't sum
            } elseif ($invoiceItem->is_taxable) {
                $this->taxable_subtotal = bcadd($this->taxable_subtotal, bcmul($invoiceItem->price, $invoiceItem->number_of_items, 2), 2);
            } else {
                $this->non_taxable_subtotal = bcadd($this->non_taxable_subtotal, bcmul($invoiceItem->price, $invoiceItem->number_of_items, 2), 2);
            }
        });
    }

    private function calculateTaxes()
    {
        $this->tps = bcmul($this->taxable_subtotal, Config::find('tps_rate')->value, 2);
        $this->tvq = bcmul($this->taxable_subtotal, Config::find('tvq_rate')->value, 2);
    }

    private function sumTotal()
    {
        $this->total = bcadd(
            bcadd(
                bcadd(
                    $this->taxable_subtotal,
                    $this->non_taxable_subtotal,
                    2
                ),
                $this->tps,
                2
            ),
            $this->tvq,
            2
        );
    }

    private function calculateInvoicePromotion()
    {
        $invoicePromotions = $this->invoiceItems
                ->where('itemable_type', 'App\Promotion')
                ->where('discounted_item_id', null);
        $invoicePromotions->each(function ($invoicePromotion) {
            $invoicePromotion->itemable->calculatePrice($this, $invoicePromotion);
        });
    }

    public function findPriciestProduct(?array $applicableProducts = null)
    {
        $products = $this->invoiceItems->where('itemable_type', 'App\Product');

        if ($applicableProducts) {
            $products = $products->whereIn('itemable_id', $applicableProducts);
        }

        return $products->sortByDesc('price')->first();
    }

    public function findLatestProduct()
    {
        $products = $this->invoiceItems->where('itemable_type', 'App\Product');

        return $products->last();
    }

    public static function dueInvoices()
    {
        $invoices = self::withTrashed()->where('status', self::CONFIRMED)->get();

        $invoices->load('invoicePayments', 'client');

        $invoices = $invoices->filter(function ($invoice) {
            return $invoice->due_amount != 0;
        });

        return $invoices;
    }

    public function scopeActive($query)
    {
        return $query->draft()->latest()->take(1);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::DRAFT);
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', self::CONFIRMED);
    }
}
