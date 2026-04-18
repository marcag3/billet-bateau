<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Calendar extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $guarded = [];

    protected $hidden = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $casts = [
        'monday'=>'boolean',
        'tuesday'=>'boolean',
        'wednesday'=>'boolean',
        'thursday'=>'boolean',
        'friday'=>'boolean',
        'saturday'=>'boolean',
        'sunday'=>'boolean',
    ];

    public function scopeActive($query, Carbon $date)
    {
        $day = strtolower($date->englishDayOfWeek);

        return $query->where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->where($day, true);
    }

    //relationships
    public function trips()
    {
        return $this->hasMany(Trip::class, 'service_id');
    }

    public function calendarDates()
    {
        return $this->hasMany(CalendarDate::class);
    }
}
