<?php

namespace App\Models;

use App\Models\Concerns\ResolvesMediaUrl;
use App\Support\ObjectStorage\EtagNormalizer;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    use HasUlids;
    use ResolvesMediaUrl;

    protected $fillable = [
        'id',
        'program_id',
        'boat_type_id',
        'water_route_id',
        'capacity',
        'name',
        'description',
        'banner_object_key',
        'banner_mime_type',
        'banner_size_bytes',
        'banner_etag',
        'banner_uploaded_at',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'banner_uploaded_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * @return Attribute<string|null, string|null>
     */
    protected function bannerEtag(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): ?string => $value,
            set: fn (?string $value): ?string => EtagNormalizer::normalize($value),
        );
    }

    /**
     * @return BelongsTo<Program, $this>
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    /**
     * @return BelongsTo<BoatType, $this>
     */
    public function boatType(): BelongsTo
    {
        return $this->belongsTo(BoatType::class, 'boat_type_id');
    }

    /**
     * @return BelongsTo<WaterRoute, $this>
     */
    public function waterRoute(): BelongsTo
    {
        return $this->belongsTo(WaterRoute::class, 'water_route_id');
    }

    /**
     * @return HasMany<Trip, $this>
     */
    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class, 'product_id');
    }
}
