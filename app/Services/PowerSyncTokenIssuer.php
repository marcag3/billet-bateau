<?php

namespace App\Services;

use Firebase\JWT\JWT;

final class PowerSyncTokenIssuer
{
    public function __construct(
        private readonly string $secret,
        private readonly string $kid,
        private readonly string $audience,
        private readonly int $ttlSeconds,
    ) {}

    public static function fromConfig(): self
    {
        return new self(
            secret: (string) config('powersync.jwt_secret'),
            kid: (string) config('powersync.jwt_kid'),
            audience: (string) config('powersync.jwt_audience'),
            ttlSeconds: (int) config('powersync.jwt_ttl_seconds'),
        );
    }

    public function issueForUserId(string $userId): string
    {
        $now = time();

        return JWT::encode(
            [
                'sub' => $userId,
                'iat' => $now,
                'exp' => $now + $this->ttlSeconds,
                'aud' => $this->audience,
            ],
            $this->secret,
            'HS256',
            $this->kid,
        );
    }
}
