<?php

namespace App\Models;

use App\Models\Boarding;
use App\Models\InvoiceItem;
use App\Models\SailingPlan;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $touches = ['client'];

    //Getters

    public function getNameAttribute()
    {
        return $this->product->name;
    }

    public function getIdentifierAttribute()
    {
        return $this->client->identifier.' : '.$this->product->name;
    }

    //Relations
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function invoiceItem()
    {
        return $this->belongsTo(InvoiceItem::class);
    }

    public function sailingPlans()
    {
        return $this->morphToMany(SailingPlan::class, 'boarding_item', 'boardings')->withTimestamps();
    }

    public function boardings()
    {
        return $this->morphMany(Boarding::class, 'boarding_item');
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    //scopes
    public function scopeAvailable($query)
    {
        $query->where('remaining_uses', '>', 0);
    }
}
