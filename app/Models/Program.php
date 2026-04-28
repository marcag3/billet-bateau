<?php

namespace App\Models;

use Database\Factories\ProgramFactory;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Program extends Model implements HasMedia
{
    /** @use HasFactory<ProgramFactory> */
    use HasFactory;

    use HasUlids;
    use InteractsWithMedia;

    protected $fillable = [
        'id',
        'user_id',
        'address_id',
        'name',
        'description',
        'theme_color',
        'is_active',
        'is_archived',
        'slug',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_archived' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }

    protected static function booted(): void
    {
        static::deleting(function (Program $program): void {
            $addressId = $program->address_id;

            if ($addressId === null) {
                return;
            }

            DB::table('programs')->where('id', $program->id)->update(['address_id' => null]);
            Address::query()->whereKey($addressId)->delete();
        });
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

    /** @return BelongsToMany<User, $this> */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function userCanManage(int $userId): bool
    {
        return $this->users()->whereKey($userId)->exists();
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'address_id');
    }

    public function boats(): BelongsToMany
    {
        return $this->belongsToMany(Boat::class, 'boat_program')->withTimestamps();
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class, 'program_id');
    }

    public function waterRoutes(): HasMany
    {
        return $this->hasMany(WaterRoute::class, 'program_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'program_id');
    }

    /**
     * Public program routes resolve by slug and exclude archived programs.
     *
     * @param  mixed  $value
     * @param  string|null  $field
     */
    public function resolveRouteBinding($value, $field = null): ?static
    {
        $field ??= $this->getRouteKeyName();

        return static::query()
            ->where($field, $value)
            ->where('is_archived', false)
            ->first();
    }

    /**
     * @return Attribute<string, string|int|float|null|bool>
     */
    protected function slug(): Attribute
    {
        return Attribute::make(
            set: static fn (mixed $value) => Str::lower(trim((string) $value)),
        );
    }
}
