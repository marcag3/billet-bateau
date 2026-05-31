<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 's3'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim(env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION', 'garage'),
            'bucket' => env('AWS_BUCKET', 'app'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT', 'http://garage:3900'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', true),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | S3 Presign Endpoint
    |--------------------------------------------------------------------------
    |
    | Optional browser-reachable endpoint used to sign temporary upload URLs.
    | When empty, the S3 disk endpoint is used.
    |
    */
    's3_presign_endpoint' => env('AWS_ENDPOINT_PUBLIC', env('AWS_ENDPOINT', env('AWS_ENDPOINT', ''))),

    /*
    |--------------------------------------------------------------------------
    | S3 CORS Allowed Origins
    |--------------------------------------------------------------------------
    |
    | Origins that may perform browser-direct PUT/GET requests against the S3
    | API endpoint (presigned uploads and public object reads).
    |
    */
    's3_cors_allowed_origins' => array_values(array_filter(
        array_map(
            static fn (string $origin): string => trim($origin),
            explode(',', (string) env('AWS_CORS_ALLOWED_ORIGINS', '*')),
        ),
        static fn (string $origin): bool => $origin !== '',
    )),

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
