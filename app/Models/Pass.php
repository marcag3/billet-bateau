<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pass extends Model
{
    use SoftDeletes;
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'expiry_date' => 'datetime',
    ];

    protected $touches = ['client'];

    //relations
    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function coupon()
    {
        return $this->hasOne(Coupon::class, 'pass_id');
    }

    public function invoiceItem()
    {
        return $this->belongsTo(InvoiceItem::class)->withDefault();
    }

    //getters

    public function getNameAttribute()
    {
        return $this->subscription->name;
    }

    //functions
    public function isActiveOnTourDate(Booking | SailingPlan $tour)
    {
        $date = $tour->date;

        return $this->expiry_date->greaterThanOrEqualTo($date);
    }

    public function isBoardingPossible(Booking | SailingPlan $tour)
    {
        if (! $this->isActiveOnTourDate($tour)) {
            // dump($this->id . ': subscription will be expired on tour date');
            return false;
        }
        if (! $this->subscription->isBoardingPossible($tour)) {
            return false;
        }

        return true;
    }

    //scopes

    public function scopeAvailable($query)
    {
        $query->whereDate('expiry_date', '>=', today());
    }
}
