<?php

namespace App\Models;

use App\Enums\VoyageStatus;
use Database\Factories\TripFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trip extends Model
{
    /** @use HasFactory<TripFactory> */
    use HasFactory;

    use HasUlids;

    protected $fillable = [
        'id',
        'program_id',
        'product_id',
        'scheduled_departure_at',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_departure_at' => 'datetime',
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
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * @return HasMany<Voyage, $this>
     */
    public function voyages(): HasMany
    {
        return $this->hasMany(Voyage::class, 'trip_id');
    }

    /**
     * Bookings that reserve this concrete trip (see `bookings.trip_id`).
     *
     * @return HasMany<Booking, $this>
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'trip_id');
    }

    /**
     * @return list<VoyageStatus>
     */
    public static function voyageStatusesBlockingPublicBooking(): array
    {
        return [
            VoyageStatus::Ready,
            VoyageStatus::Underway,
            VoyageStatus::Completed,
            VoyageStatus::Cancelled,
        ];
    }

    public function isPubliclyBookable(): bool
    {
        if ($this->scheduled_departure_at->isPast()) {
            return false;
        }

        $blockingStatuses = array_map(
            static fn (VoyageStatus $status): string => $status->value,
            self::voyageStatusesBlockingPublicBooking(),
        );

        return ! $this->voyages()
            ->whereIn('status', $blockingStatuses)
            ->exists();
    }

    /**
     * @param  Builder<Trip>  $query
     * @return Builder<Trip>
     */
    public function scopePubliclyBookable(Builder $query): Builder
    {
        $blockingStatuses = array_map(
            static fn (VoyageStatus $status): string => $status->value,
            self::voyageStatusesBlockingPublicBooking(),
        );

        return $query
            ->where('scheduled_departure_at', '>=', now())
            ->whereDoesntHave('voyages', static function (Builder $voyageQuery) use ($blockingStatuses): void {
                $voyageQuery->whereIn('status', $blockingStatuses);
            });
    }
}
