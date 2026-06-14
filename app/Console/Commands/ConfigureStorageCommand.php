<?php

namespace App\Console\Commands;

use Aws\Exception\AwsException;
use Aws\S3\S3Client;
use Illuminate\Console\Command;

class ConfigureStorageCommand extends Command
{
    protected $signature = 'storage:configure
                            {--disk=s3 : Filesystem disk that holds the S3 bucket name}
                            {--dry-run : Print planned changes without running them}';

    protected $description = 'Create the S3 bucket (if missing), public read policy, and CORS for browser uploads (local RustFS dev).';

    public function handle(): int
    {
        $diskName = (string) $this->option('disk');
        /** @var array<string, mixed> $config */
        $config = config("filesystems.disks.{$diskName}", []);

        if (($config['driver'] ?? '') !== 's3') {
            $this->error("Disk [{$diskName}] must use the s3 driver.");

            return self::FAILURE;
        }

        $bucket = (string) ($config['bucket'] ?? '');
        if ($bucket === '') {
            $this->error('Disk bucket is empty; set AWS_BUCKET.');

            return self::FAILURE;
        }

        $corsConfiguration = $this->corsConfiguration();
        $publicReadPolicy = $this->publicReadPolicy($bucket);
        $endpoint = (string) ($config['endpoint'] ?? '');
        $region = (string) ($config['region'] ?? '');

        if ((bool) $this->option('dry-run')) {
            $this->line('S3 bucket configuration dry run:');
            $this->line('bucket='.$bucket);
            $this->line('endpoint='.($endpoint !== '' ? $endpoint : '(default AWS endpoint)'));
            $this->line('region='.($region !== '' ? $region : '(default us-east-1)'));
            $this->line('public_read_policy='.json_encode($publicReadPolicy));
            $this->line('cors='.json_encode($corsConfiguration));

            return self::SUCCESS;
        }

        try {
            $client = $this->s3Client($config);
            $this->ensureBucketExists($client, $bucket);
            $client->putBucketPolicy([
                'Bucket' => $bucket,
                'Policy' => json_encode($publicReadPolicy, JSON_THROW_ON_ERROR),
            ]);
            $client->putBucketCors([
                'Bucket' => $bucket,
                'CORSConfiguration' => $corsConfiguration,
            ]);
        } catch (AwsException $exception) {
            $this->error($exception->getAwsErrorMessage() ?? $exception->getMessage());

            return self::FAILURE;
        }

        $this->info("Bucket [{$bucket}] public read policy and CORS configured.");

        return self::SUCCESS;
    }

    private function ensureBucketExists(S3Client $client, string $bucket): void
    {
        if ($client->doesBucketExist($bucket)) {
            return;
        }

        $client->createBucket(['Bucket' => $bucket]);
    }

    /**
     * @return array{Version: string, Statement: array<int, array{Effect: string, Principal: string, Action: array<int, string>, Resource: array<int, string>}>}
     */
    private function publicReadPolicy(string $bucket): array
    {
        return [
            'Version' => '2012-10-17',
            'Statement' => [[
                'Effect' => 'Allow',
                'Principal' => '*',
                'Action' => ['s3:GetObject'],
                'Resource' => ["arn:aws:s3:::{$bucket}/*"],
            ]],
        ];
    }

    /**
     * @return array{CORSRules: array<int, array{AllowedOrigins: array<int, string>, AllowedMethods: array<int, string>, AllowedHeaders: array<int, string>, ExposeHeaders: array<int, string>, MaxAgeSeconds: int}>}
     */
    private function corsConfiguration(): array
    {
        /** @var mixed $configuredOrigins */
        $configuredOrigins = config('filesystems.s3_cors_allowed_origins', ['*']);
        $allowedOrigins = collect(is_array($configuredOrigins) ? $configuredOrigins : [$configuredOrigins])
            ->filter(static fn (mixed $origin): bool => is_string($origin) && trim($origin) !== '')
            ->map(static fn (mixed $origin): string => trim((string) $origin))
            ->values()
            ->all();

        if ($allowedOrigins === []) {
            $allowedOrigins = ['*'];
        }

        return [
            'CORSRules' => [[
                'AllowedOrigins' => $allowedOrigins,
                'AllowedMethods' => ['GET', 'HEAD', 'PUT'],
                'AllowedHeaders' => ['*'],
                'ExposeHeaders' => ['ETag'],
                'MaxAgeSeconds' => 3600,
            ]],
        ];
    }

    /**
     * @param  array<string, mixed>  $diskConfig
     */
    private function s3Client(array $diskConfig): S3Client
    {
        $clientConfig = [
            'version' => 'latest',
            'region' => (string) ($diskConfig['region'] ?? 'us-east-1'),
            'use_path_style_endpoint' => $this->usePathStyleEndpoint($diskConfig),
        ];

        $endpoint = (string) ($diskConfig['endpoint'] ?? '');
        if ($endpoint !== '') {
            $clientConfig['endpoint'] = $endpoint;
        }

        $key = (string) ($diskConfig['key'] ?? '');
        $secret = (string) ($diskConfig['secret'] ?? '');
        if ($key !== '' && $secret !== '') {
            $clientConfig['credentials'] = [
                'key' => $key,
                'secret' => $secret,
            ];
        }

        return new S3Client($clientConfig);
    }

    /**
     * Custom S3 endpoints (RustFS, R2, MinIO) require path-style URLs for bucket admin APIs.
     *
     * @param  array<string, mixed>  $diskConfig
     */
    private function usePathStyleEndpoint(array $diskConfig): bool
    {
        $endpoint = (string) ($diskConfig['endpoint'] ?? '');
        if ($endpoint !== '') {
            return true;
        }

        return (bool) ($diskConfig['use_path_style_endpoint'] ?? false);
    }
}
