<?php

namespace App\Models;

use Database\Factories\BoatFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Boat extends Model
{
    /** @use HasFactory<BoatFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'boat_type_id',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function boatType(): BelongsTo
    {
        return $this->belongsTo(BoatType::class, 'boat_type_id');
    }
}
