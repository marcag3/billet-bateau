<?php

namespace App\Data\Programs;

use App\Models\User;
use Spatie\LaravelData\Data;

final class ProgramMemberData extends Data
{
    public function __construct(
        public string $user_id,
        public string $name,
        public string $email,
        public string $role,
    ) {}

    public static function fromUser(User $user): self
    {
        return new self(
            user_id: (string) $user->getKey(),
            name: (string) $user->name,
            email: (string) $user->email,
            role: (string) $user->pivot->role,
        );
    }
}
