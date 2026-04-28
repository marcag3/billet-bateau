<?php

namespace App\Models;

use Database\Factories\TemplateDaySlotFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateDaySlot extends Model
{
    /** @use HasFactory<TemplateDaySlotFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'template_day_id',
        'sort_order',
        'departure_time',
        'capacity',
        'boat_type_id',
        'water_route_id',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'capacity' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function templateDay(): BelongsTo
    {
        return $this->belongsTo(TemplateDay::class, 'template_day_id');
    }

    public function boatType(): BelongsTo
    {
        return $this->belongsTo(BoatType::class, 'boat_type_id');
    }

    public function waterRoute(): BelongsTo
    {
        return $this->belongsTo(WaterRoute::class, 'water_route_id');
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class, 'template_day_slot_id');
    }
}
