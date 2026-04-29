<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Address row owned by exactly one program ({@see Program::$address_id} links back).
 *
 * @property string $program_id
 */
class Address extends Model
{
    use HasUlids;

    protected $fillable = [
        'id',
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

    /**
     * @return BelongsTo<Program, $this>
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }
}
