<?php

namespace App\Models;

use App\Enums\VoyageStatus;
use Database\Factories\VoyageFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voyage extends Model
{
    /** @use HasFactory<VoyageFactory> */
    use HasFactory;

    use HasUlids;

    protected $fillable = [
        'id',
        'user_id',
        'trip_id',
        'water_route_id',
        'scheduled_departure_at',
        'started_at',
        'arrived_at',
        'status',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_departure_at' => 'datetime',
            'started_at' => 'datetime',
            'arrived_at' => 'datetime',
            'status' => VoyageStatus::class,
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class, 'trip_id');
    }

    public function waterRoute(): BelongsTo
    {
        return $this->belongsTo(WaterRoute::class, 'water_route_id');
    }

    public function boats(): BelongsToMany
    {
        return $this->belongsToMany(Boat::class, 'voyage_boat')->withTimestamps();
    }

    public function guides(): BelongsToMany
    {
        return $this->belongsToMany(Guide::class, 'voyage_guide')->withTimestamps();
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class, 'voyage_id');
    }

    public function passengers(): HasMany
    {
        return $this->hasMany(Passenger::class, 'voyage_id');
    }
}
