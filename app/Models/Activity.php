<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;

class Activity extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    //getters

    public function getRulesAttribute()
    {
        return App::currentLocale() == 'en-US' ? $this->rules_en : $this->rules_fr;
    }
    //relationships

    public function boatCategories()
    {
        return $this->hasMany(BoatCategory::class);
    }
}
