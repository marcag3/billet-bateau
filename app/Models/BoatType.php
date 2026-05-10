<?php

namespace App\Models;

use App\Models\Concerns\ResolvesMediaUrl;
use App\Support\ObjectStorage\EtagNormalizer;
use Database\Factories\BoatTypeFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $program_id
 */
class BoatType extends Model
{
    /** @use HasFactory<BoatTypeFactory> */
    use HasFactory;

    use HasUlids;
    use ResolvesMediaUrl;

    protected $fillable = [
        'id',
        'program_id',
        'name',
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

    public function boats(): HasMany
    {
        return $this->hasMany(Boat::class, 'boat_type_id');
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class, 'boat_type_id');
    }
}
