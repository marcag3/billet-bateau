<?php

return [
    /**
     * Browser-reachable base URL for the PowerSync service (scheme + host + port).
     */
    'public_url' => rtrim((string) env('POWERSYNC_PUBLIC_URL', 'http://localhost:6080'), '/'),

    /**
     * Shared secret for HS256 JWTs (UTF-8 string). Must match the PowerSync service `client_auth.jwks` oct key material.
     */
    'jwt_secret' => (string) env('POWERSYNC_JWT_SECRET', 'powersync-local-poc-secret-32_bytes!'),

    /**
     * Base64url-encoded form of `jwt_secret`, embedded in PowerSync `client_auth.jwks.keys[].k`.
     */
    'jwt_secret_base64url' => (string) env('POWERSYNC_JWT_SECRET_B64URL'),

    'jwt_kid' => (string) env('POWERSYNC_JWT_KID', 'local-dev'),

    /**
     * Single audience claim value. Must be listed in PowerSync `client_auth.audience`.
     */
    'jwt_audience' => (string) env('POWERSYNC_JWT_AUDIENCE', 'powersync-dev'),

    'jwt_ttl_seconds' => (int) env('POWERSYNC_JWT_TTL_SECONDS', 300),
];
