<?php

namespace App\Models;

use Database\Factories\TicketTypeFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketType extends Model
{
    /** @use HasFactory<TicketTypeFactory> */
    use HasFactory;

    use HasUlids;

    protected $fillable = [
        'id',
        'program_id',
        'title',
        'price_cents',
        'is_pay_what_you_can',
        'min_per_purchase',
        'max_per_purchase',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'is_pay_what_you_can' => 'boolean',
            'min_per_purchase' => 'integer',
            'max_per_purchase' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    public function bookingTickets(): HasMany
    {
        return $this->hasMany(BookingTicket::class, 'ticket_type_id');
    }
}
