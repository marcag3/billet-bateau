<?php

namespace App\Models;

use Database\Factories\BoatTypeFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/**
 * @property string $program_id
 */
class BoatType extends Model implements HasMedia
{
    /** @use HasFactory<BoatTypeFactory> */
    use HasFactory;

    use HasUlids;
    use InteractsWithMedia;

    protected $fillable = [
        'id',
        'user_id',
        'program_id',
        'name',
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

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('images')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
