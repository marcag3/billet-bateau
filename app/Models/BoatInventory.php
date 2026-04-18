<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BoatInventory extends Model
{
    protected $guarded = [];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    //relationships
    public function boatCategory()
    {
        return $this->belongsTo(BoatCategory::class);
    }

    public function trips()
    {
        return $this->hasMany(Trip::class);
    }
}
