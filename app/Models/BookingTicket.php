<?php

namespace App\Models;

use Database\Factories\BookingTicketFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingTicket extends Model
{
    /** @use HasFactory<BookingTicketFactory> */
    use HasFactory;

    use HasUlids;

    protected $fillable = [
        'id',
        'booking_id',
        'ticket_type_id',
        'name',
        'email',
        'country',
        'custom_fields',
        'waiver_confirmation_id',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'custom_fields' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class, 'ticket_type_id');
    }
}
