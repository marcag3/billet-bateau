<?php

namespace App\Models;

use Database\Factories\TripFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trip extends Model
{
    /** @use HasFactory<TripFactory> */
    use HasFactory;

    use HasUlids;

    protected $fillable = [
        'id',
        'program_id',
        'boat_type_id',
        'water_route_id',
        'template_day_slot_id',
        'scheduled_departure_at',
        'capacity',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_departure_at' => 'datetime',
            'capacity' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    public function boatType(): BelongsTo
    {
        return $this->belongsTo(BoatType::class, 'boat_type_id');
    }

    public function waterRoute(): BelongsTo
    {
        return $this->belongsTo(WaterRoute::class, 'water_route_id');
    }

    public function templateDaySlot(): BelongsTo
    {
        return $this->belongsTo(TemplateDaySlot::class, 'template_day_slot_id');
    }

    public function voyages(): HasMany
    {
        return $this->hasMany(Voyage::class, 'trip_id');
    }
}
