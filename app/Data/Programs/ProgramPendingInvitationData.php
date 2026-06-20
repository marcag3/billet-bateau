<?php

namespace App\Data\Programs;

use App\Models\ProgramInvitation;
use Spatie\LaravelData\Data;

final class ProgramPendingInvitationData extends Data
{
    public function __construct(
        public string $id,
        public string $email,
        public string $expires_at,
        public string $created_at,
    ) {}

    public static function fromModel(ProgramInvitation $invitation): self
    {
        return new self(
            id: (string) $invitation->getKey(),
            email: (string) $invitation->email,
            expires_at: $invitation->expires_at->toIso8601String(),
            created_at: $invitation->created_at->toIso8601String(),
        );
    }
}
