<?php

return [
    'url' => env('ELECTRIC_URL', 'http://localhost:5133'),
    'service_url' => env('ELECTRIC_SERVICE_URL', 'http://electric:3000'),
    'secret' => env('ELECTRIC_SECRET', 'electric-local-dev-secret-with-32-bytes-minimum'),
    'jwt_issuer' => env('ELECTRIC_JWT_ISSUER', env('APP_URL')),
    'jwt_audience' => env('ELECTRIC_JWT_AUDIENCE', 'electric'),
    'jwt_ttl_seconds' => (int) env('ELECTRIC_JWT_TTL_SECONDS', 300),
];
