<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    protected $primaryKey = 'program_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'program_id',
        'line_1',
        'line_2',
        'city',
        'postal_code',
        'country',
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

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id', 'id');
    }
}
