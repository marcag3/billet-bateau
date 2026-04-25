<?php

namespace App\Models;

use Clickbar\Magellan\Data\Geometries\LineString;
use Database\Factories\WaterRouteFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WaterRoute extends Model
{
    /** @use HasFactory<WaterRouteFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'name',
        'trace',
        'duration_minutes',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'trace' => LineString::class,
            'duration_minutes' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class, 'water_route_id');
    }

    public function voyages(): HasMany
    {
        return $this->hasMany(Voyage::class, 'water_route_id');
    }
}
