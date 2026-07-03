<?php

namespace App\Models;

use Database\Factories\BookingFactory;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Log;

class Booking extends Model
{
    /** @use HasFactory<BookingFactory> */
    use HasFactory;

    use HasUlids;
    use SoftDeletes;

    protected $fillable = [
        'id',
        'program_id',
        'trip_id',
        'contact_name',
        'contact_email',
        'contact_locale',
        'cancel_token_hash',
        'cancel_token',
        'departure_reminder_sent_at',
        'cancelled_by_voyage_id',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'cancel_token' => 'encrypted',
            'departure_reminder_sent_at' => 'datetime',
            'deleted_at' => 'datetime',
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

    /**
     * @return BelongsTo<Trip, $this>
     */
    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class, 'trip_id');
    }

    public function checkIn(): HasOne
    {
        return $this->hasOne(CheckIn::class, 'booking_id');
    }

    public function passengers(): HasMany
    {
        return $this->hasMany(Passenger::class, 'booking_id');
    }

    public function bookingTickets(): HasMany
    {
        return $this->hasMany(BookingTicket::class, 'booking_id');
    }

    public function plainCancelToken(): ?string
    {
        $raw = $this->getAttributes()['cancel_token'] ?? null;

        if (! is_string($raw) || $raw === '') {
            return null;
        }

        try {
            return $this->fromEncryptedString($raw);
        } catch (DecryptException $exception) {
            Log::warning('Unable to decrypt booking cancel_token.', [
                'booking_id' => $this->getKey(),
                'exception' => $exception->getMessage(),
            ]);

            return null;
        }
    }
}
