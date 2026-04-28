<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BoatProgram extends Model
{
    use HasUlids;

    protected $table = 'boat_program';

    protected $fillable = [
        'id',
        'boat_id',
        'program_id',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function boat(): BelongsTo
    {
        return $this->belongsTo(Boat::class, 'boat_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }
}
