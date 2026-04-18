<?php

namespace App\Models;

use App\Models\Client;
use App\Models\SailingPlan;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Boarding extends Model
{
    use softdeletes;
    use HasFactory;

    protected $guarded = [];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $touches = ['client'];

    //relationships

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function sailingPlan()
    {
        return $this->belongsTo(SailingPlan::class);
    }

    public function boarding_item()
    {
        return $this->morphTo();
    }
}
