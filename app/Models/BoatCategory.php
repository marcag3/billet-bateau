<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class BoatCategory extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $casts = [
        'total_capacity' => 'integer',
        'teen_capacity' => 'integer',
        'child_capacity' => 'integer',
        'minimum_booking_person' => 'integer',
        'activity_id' => 'integer',
    ];

    protected $appends = ['imageURL'];

    public function getImageURLAttribute()
    {
        return $this->image === null ? null : asset(Storage::url($this->image));
    }

    //relationships

    public function activity()
    {
        return $this->belongsTo(Activity::class);
    }
}
