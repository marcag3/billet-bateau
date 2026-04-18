<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Boat extends Model
{
    use softdeletes;
    use HasFactory;

    protected $guarded = [];

    protected $appends = [
        'boat_category_name',
    ];

    //GETTERS

    public function getIdentifierAttribute()
    {
        return $this->name.', '.$this->capacity.' place, '.$this->boatCategory->name;
    }

    public function getBoatCategoryNameAttribute()
    {
        return $this->boatCategory->name;
    }

    //RELATIONS

    public function boatCategory()
    {
        return $this->belongsTo(\App\Models\BoatCategory::class)->withDefault();
    }

    public function sailingPlans()
    {
        return $this->belongsToMany(\App\Models\SailingPlan::class)->withTimestamps();
    }
}
