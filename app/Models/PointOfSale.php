<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PointOfSale extends Model
{
    protected $table = 'points_of_sale';

    protected $guarded = [];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'is_for_client'=>'boolean',
    ];

    //relationships
    public function area()
    {
        return $this->belongsTo(Area::class);
    }
}
