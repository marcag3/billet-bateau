<?php

namespace App\Models;

use App\Enums\ProgramRole;
use App\Models\Concerns\ResolvesMediaUrl;
use App\Support\ObjectStorage\EtagNormalizer;
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

class Program extends Model
{
    /** @use HasFactory<ProgramFactory> */
    use HasFactory;

    use HasUlids;
    use ResolvesMediaUrl;

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
            'is_active' => 'boolean',
            'is_archived' => 'boolean',
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

    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
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

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'program_id');
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
     * @return HasMany<ProgramInvitation, $this>
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(ProgramInvitation::class, 'program_id');
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
