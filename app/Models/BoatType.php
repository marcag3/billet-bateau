<?php

namespace App\Models;

use Database\Factories\BoatTypeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class BoatType extends Model implements HasMedia
{
    /** @use HasFactory<BoatTypeFactory> */
    use HasFactory;

    use InteractsWithMedia;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
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

    public function boats(): HasMany
    {
        return $this->hasMany(Boat::class, 'boat_type_id');
    }
}
