<?php

namespace App\Models;

use Carbon\CarbonInterval;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Route extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $guarded = [];

    protected $hidden = [
        'route_type',
        'route_url',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $appends = [
        'duration',
    ];

    protected $with = ['routeStops.stop'];

    //relationships
    public function routeStops()
    {
        return $this->hasMany(RouteStop::class);
    }

    public function stops()
    {
        return $this->belongsToMany(Stop::class, 'route_stops');
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }

    //getters
    public function getDurationAttribute()
    {
        $routeStops = $this->routeStops->sortBy('stop_sequence', SORT_NUMERIC);

        if ($routeStops->count() == 0) {
            return 0;
        }

        $firstStopTime = $routeStops->values()->first()->arrival_minutes;
        $lastStopTime = $routeStops->values()->last()->arrival_minutes;

        return $lastStopTime - $firstStopTime;
    }
}
