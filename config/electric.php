<?php

return [
    'service_url' => env('ELECTRIC_SERVICE_URL', 'http://electric:3000'),
    'source_id' => env('ELECTRIC_SOURCE_ID', 'default'),
    'api_secret' => env('ELECTRIC_API_SECRET', 'electric-local-dev-secret-with-32-bytes-minimum'),
];
