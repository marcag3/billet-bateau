<?php

namespace App\Models;

use Database\Factories\BoatFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Boat extends Model
{
    /** @use HasFactory<BoatFactory> */
    use HasFactory;

    use HasUlids;

    protected $fillable = [
        'id',
        'boat_type_id',
        'program_id',
        'name',
        'capacity',
        'notes',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function boatType(): BelongsTo
    {
        return $this->belongsTo(BoatType::class, 'boat_type_id');
    }

    public function voyages(): BelongsToMany
    {
        return $this->belongsToMany(Voyage::class, 'voyage_boat')->withTimestamps();
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }
}
