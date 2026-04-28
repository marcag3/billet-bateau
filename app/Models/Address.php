<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Address extends Model
{
    use HasUlids;

    protected $fillable = [
        'id',
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

    public function program(): HasOne
    {
        return $this->hasOne(Program::class, 'address_id', 'id');
    }
}
