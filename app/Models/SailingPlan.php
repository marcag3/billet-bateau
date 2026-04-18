<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SailingPlan extends Model
{
    use softDeletes;

    protected $guarded = [];

    protected $casts = [
        'departure' => 'datetime',
        'arrival' => 'datetime',
    ];

    const PLANNED = 1;

    const ON_WATER = 2;

    const BACK = 3;

    //GETTERS
    public function getIsRentalAttribute()
    {
        return $this->guide_id === null;
    }

    public function getTitleAttribute()
    {
        return $this->clients->pluck('full_name')->implode(', ');
    }

    public function getDurationAttribute()
    {
        return $this->departure->diff($this->arrival)->format('%H:%I');
    }

    public function getIdentifierAttribute()
    {
        return $this->title.' '.$this->departure->isoFormat('ll');
    }

    public function getDateAttribute()
    {
        return $this->departure;
    }

    //RELATIONS

    public function boatCategory()
    {
        return $this->belongsTo(BoatCategory::class);
    }

    public function clients()
    {
        return $this->belongsToMany(Client::class, 'boardings')
            ->wherePivotNull('deleted_at')
            ->withPivot('boarding_item_id', 'boarding_item_type')
            ->withTimestamps();
    }

    public function guide()
    {
        return $this->belongsTo(User::class, 'guide_id')->withDefault();
    }

    public function trip()
    {
        return $this->belongsTo(Trip::class)->withDefault();
    }

    public function boardings()
    {
        return $this->hasMany(Boarding::class);
    }

    public function route()
    {
        return $this->belongsTo(Route::class);
    }
}
