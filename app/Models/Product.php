<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class Product extends Model
{
    protected $guarded = [];

    protected $casts = [
        'required_products_id'=> 'json',
        'replace_products_id'=>'json',
        'price' => 'decimal:2',
        'is_rental' => 'boolean',
        'is_initiation' => 'boolean',
        'is_taxable' => 'boolean',
        'is_child' => 'boolean',
        'is_teen' => 'boolean',
        'is_adult' => 'boolean',
        'available_points_of_sale_ids' => 'json',
        'is_full_boat' => 'boolean',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $appends = [
        // 'boat_category_name',
        // 'subscription_name'
    ];

    private $pointsOfSale;

    //Relations

    //TODO: est-ce que c'est encore utilisé?
    //TODO: use new laravel 9 getters to benefit automatic cache
    public function getRequiredProductsAttribute()
    {
        //relation with json field type

        $products = '';
        if ($this->required_products_id) {
            $ids = $this->required_products_id;
            $products = DB::table('products')->whereIn('id', $ids)->get();
        }

        return $products;
    }

    public function boatCategory()
    {
        return $this->belongsTo(BoatCategory::class, 'boat_category_id')->withDefault();
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class, 'required_subscription_id')->withDefault();
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    //Getters

    public function getBoatCategoryNameAttribute()
    {
        return $this->boatCategory->name;
    }

    public function getSubscriptionNameAttribute()
    {
        return $this->subscription->name;
    }

    //TODO: use new laravel 9 getters to benefit automatic cache
    public function getPointsOfSaleAttribute()
    {
        if ($this->pointsOfSale) {
            return $this->pointsOfSale;
        }
        //relation with json field type
        if ($this->available_points_of_sale_ids) {
            $ids = $this->available_points_of_sale_ids;
            $this->pointsOfSale = PointOfSale::whereIn('id', $ids)->get();
        }

        return $this->pointsOfSale;
    }

    public function getAreasIdsAttribute()
    {
        return $this->points_of_sale->pluck('area_id')->unique()->toArray();
    }

    public function getAreasAttribute()
    {
        return Area::whereIn('id', $this->areas_ids)->get();
    }

    //Functions

    //TODO: move to global scope maybe?
    public function scopeAvailable($query)
    {
        return $query->whereJsonLength('available_points_of_sale_ids', '>', 0);
    }

    public static function availableProducts(Collection $subscriptions, Invoice $invoice = null)
    {

        //Sélectionner les products disponible selon les abonements
        $products = self::whereIn('required_subscription_id', $subscriptions)
            ->orWhereNull('required_subscription_id')->get();
        $products = $products->keyBy('id');

        //enlever les products qui requierts d'autres products
        if ($invoice->invoiceItems->count() > 0) {
            foreach ($products as $verifProduct) {
                if ($verifProduct->required_products_id != null) {
                    $remove = true;

                    foreach ($verifProduct->required_products_id as $requiredProduct) {
                        if ($invoice->invoiceItems->pluck('itemable_id')->contains($requiredProduct)) {
                            $remove = false;  //on garde le produit si un product requis est présent dans le panier.
                            break;
                        }
                    }
                    $remove ? $products->forget($verifProduct->id) : '';
                }
            }
        } else {
            $products = $products->where('required_products_id', null);
        }

        //Enlever les products remplacés
        foreach ($products as $verifProduct) {
            if ($verifProduct->replace_products_id != null) {
                foreach ($verifProduct->replace_products_id as $replaceProduct) {
                    $products->forget($replaceProduct);
                }
            }
        }

        //enlever les products qui nécessitent d'avoir été guidé
        if (! $invoice->client->initiation_sailing_plan_id) {
            $products = $products->where('is_rental', false);
        }

        return $products;
    }

    public function isBoardingPossible(Client $client, Booking | SailingPlan $tour)
    {
        $boatCategory = $tour->boatCategory;
        $duration = $tour->planned_duration;
        $is_rental = $tour->is_rental;
        $activeSubscriptionsId = $client->passes
            ->filter(function ($passes) use ($tour) {
                return $passes->isActiveOnTourDate($tour);
            })
            ->pluck('subscription_id')
            ->push(null)
            ->toArray();

        if ($this->is_rental !== $is_rental) {
            // dump('rental status do not match');
            return false;
        }
        if ($this->duration !== $duration) {
            // dump('duration do not match');
            return false;
        }
        if ($this->boat_category_id !== $boatCategory->id) {
            // dump('boat category do not match');
            return false;
        }
        if ($tour instanceof Booking && $this->is_full_boat !== $tour->is_full_boat) {
            // dump('full boat do not match');
            return false;
        }
        if (! in_array($this->required_subscription_id, $activeSubscriptionsId)) {
            // dump('client do not have the required subscription at the tour date');
            return false;
        }
        if (! in_array($tour->route->area_id, $this->areas_ids)) {
            // dump($this->id . ': area do not match');
            return false;
        }

        return true;
    }
}
