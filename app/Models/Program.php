<?php

namespace App\Models;

use App\Enums\ProgramRole;
use App\Models\ProgramUser;
use Database\Factories\ProgramFactory;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'name',
        'description',
        'theme_color',
        'is_active',
        'is_archived',
        'slug',
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

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('images')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    /** @return BelongsToMany<User, $this> */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->using(ProgramUser::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function userCanManage(string $userId): bool
    {
        return $this->users()->whereKey($userId)->exists();
    }

    public function userRole(string $userId): ?ProgramRole
    {
        $pivot = $this->users()->whereKey($userId)->first();

        if ($pivot === null || ! isset($pivot->pivot->role)) {
            return null;
        }

        return ProgramRole::tryFrom((string) $pivot->pivot->role);
    }

    public function userIsOwner(string $userId): bool
    {
        return $this->userRole($userId) === ProgramRole::Owner;
    }

    public function boats(): HasMany
    {
        return $this->hasMany(Boat::class, 'program_id');
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

    public function ticketTypes(): HasMany
    {
        return $this->hasMany(TicketType::class, 'program_id');
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
