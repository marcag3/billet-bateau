<?php

namespace App\Models;

use App\Models\Config;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subscription extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'price' => 'decimal:2',
        // 'duration'=>'datetime:d',
        'is_taxable' => 'boolean',
        'boat_categories_id'=>'json',
        'permits_boarding'=>'boolean',
        'is_rental'=>'boolean',
        'is_full_boat'=>'boolean',
        'fiscal_year_expiry'=>'boolean',
        'available_points_of_sale_ids'=>'json',
    ];

    protected $appends = [
        'expiration_date',
    ];

    private $pointsOfSale;

    //relations

    public function passes()
    {
        return $this->hasMany(Pass::class);
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class, 'add_promotion_id')->withDefault(['name'=>'Aucune promotion']);
    }

    //getters

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

    public function getExpirationDateAttribute()
    {
        if ($this->fiscal_year_expiry) {
            // the end of fiscal year of the current year
            $day = Carbon::createFromFormat('d-m H', Config::find('fiscal_year_end_day')->value.'-'.Config::find('fiscal_year_end_month')->value.'00');
            $now = Carbon::now();
            // If today after $day
            if ($now >= $day) {
                $day->addYear();
            }

            return $day;
        } else {
            return today()->addDays($this->duration);
        }
    }

    //functions
    public function isBoardingPossible(Booking | SailingPlan $tour)
    {
        $boatCategory = $tour->boatCategory;
        $is_rental = $tour->is_rental;

        if (! $this->permits_boarding) {
            // dump($this->id . ': subscription does not permits boarding');
            return false;
        }
        if ($this->is_rental !== $is_rental) {
            // dump($this->id . ': rental status does not match');
            return false;
        }
        if (! in_array($boatCategory->id, $this->boat_categories_id)) {
            // dump($this->id . ': boat category does not match');
            return false;
        }
        if (! in_array($tour->route->area_id, $this->areas_ids)) {
            // dump($this->id . ': area do not match');
            return false;
        }

        if (get_class($tour) === Booking::class && $this->is_full_boat !== $tour->is_full_boat) {
            // dump($this->id . ': full boat status do not match');
            return false;
        }

        return true;
        //child and teen?
    }
}
