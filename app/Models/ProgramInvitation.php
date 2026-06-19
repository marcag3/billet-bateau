<?php

namespace App\Models;

use App\Enums\ProgramRole;
use Database\Factories\ProgramInvitationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/**
 * @property-read Program|null $program
 */
class ProgramInvitation extends Model
{
    /** @use HasFactory<ProgramInvitationFactory> */
    use HasFactory;

    use HasUlids;

    protected $fillable = [
        'id',
        'program_id',
        'invited_by_user_id',
        'email',
        'role',
        'token_hash',
        'expires_at',
        'accepted_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
            'revoked_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Program, $this> */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    /** @return BelongsTo<User, $this> */
    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }

    /**
     * @param  Builder<ProgramInvitation>  $query
     */
    public function scopePending(Builder $query): void
    {
        $query
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now());
    }

    public static function hasPendingInvitationForEmail(string $email): bool
    {
        $normalizedEmail = Str::lower(trim($email));
        if ($normalizedEmail === '') {
            return false;
        }

        return static::query()
            ->pending()
            ->whereRaw('LOWER(email) = ?', [$normalizedEmail])
            ->exists();
    }

    public function isPending(): bool
    {
        if ($this->accepted_at !== null || $this->revoked_at !== null) {
            return false;
        }

        return $this->expires_at->isFuture();
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function intendedRole(): ProgramRole
    {
        return ProgramRole::tryFrom((string) $this->role) ?? ProgramRole::Admin;
    }
}
