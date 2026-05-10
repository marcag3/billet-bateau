<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Public media base URL
    |--------------------------------------------------------------------------
    |
    | Browser-facing base URL for objects stored under keys like uploads/{ulid}.ext.
    | Must not include a trailing slash.
    |
    | Keep this aligned with the public URL for your object-storage disk (for example the same
    | value as `filesystems.disks.s3.url` / `AWS_URL`) so API responses and hydrated models match.
    |
    */
    'public_base_url' => env('AWS_URL', env('AWS_ENDPOINT_PUBLIC', '')),
];
