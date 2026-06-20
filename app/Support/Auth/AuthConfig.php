<?php

declare(strict_types=1);

namespace App\Support\Auth;

final class AuthConfig
{
    /**
     * @return array{google_oauth_enabled: bool}
     */
    public static function spaPayload(): array
    {
        return [
            'google_oauth_enabled' => filled(config('services.google.client_id')),
        ];
    }
}
