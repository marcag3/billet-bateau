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

    'jwt_kid' => (string) env('POWERSYNC_JWT_KID', 'local-dev'),

    /**
     * Single audience claim value. Must be listed in PowerSync `client_auth.audience`.
     */
    'jwt_audience' => (string) env('POWERSYNC_JWT_AUDIENCE', 'powersync-dev'),

    'jwt_ttl_seconds' => (int) env('POWERSYNC_JWT_TTL_SECONDS', 300),

    /**
     * Embedded PowerSync service paths (production image).
     */
    'service_entry' => '/opt/powersync/service/lib/entry.js',

    'entrypoint' => '/opt/powersync/entrypoint.sh',

    'config_path' => (string) env('POWERSYNC_CONFIG_PATH', '/config/service.yaml'),

    'port' => (int) env('PS_PORT', 8080),

    'data_source_uri' => env('PS_DATA_SOURCE_URI')
        ?: env('POWERSYNC_DATA_SOURCE_URI')
        ?: (
            env('DB_PASSWORD') && env('DB_DATABASE')
                ? 'postgresql://powersync:'.env('DB_PASSWORD').'@pgsql:5432/'.env('DB_DATABASE').'?sslmode=disable'
                : null
        ),

    'storage_source_uri' => env('PS_STORAGE_SOURCE_URI')
        ?: env('POWERSYNC_STORAGE_SOURCE_URI')
        ?: (
            env('DB_USERNAME') && env('DB_PASSWORD')
                ? 'postgresql://'.env('DB_USERNAME').':'.env('DB_PASSWORD').'@pgsql:5432/powersync_storage?sslmode=disable'
                : null
        ),

    'compact_node_options' => (string) env('POWERSYNC_COMPACT_NODE_OPTIONS', '--max-old-space-size-percentage=80'),

    /**
     * Internal PowerSync admin API base URL (Docker network hostname in production).
     */
    'admin_api_url' => rtrim((string) env('POWERSYNC_ADMIN_API_URL', 'http://powersync:8080'), '/'),

    /**
     * Bearer token matching a value in PowerSync `api.tokens` (service.yaml).
     */
    'admin_api_token' => (string) env('POWERSYNC_ADMIN_API_TOKEN', 'powersync-local-admin-token'),

    'diagnostics_check_enabled' => (bool) env('POWERSYNC_DIAGNOSTICS_CHECK_ENABLED', true),
];
