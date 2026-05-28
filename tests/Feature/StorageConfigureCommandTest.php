<?php

namespace Tests\Feature;

use App\Console\Commands\ConfigureStorageCommand;
use ReflectionMethod;
use Tests\TestCase;

class StorageConfigureCommandTest extends TestCase
{
    public function test_use_path_style_endpoint_when_custom_s3_endpoint_is_configured(): void
    {
        $command = new ConfigureStorageCommand;
        $method = new ReflectionMethod(ConfigureStorageCommand::class, 'usePathStyleEndpoint');
        $method->setAccessible(true);

        $this->assertTrue($method->invoke($command, [
            'endpoint' => 'http://garage:3900',
            'use_path_style_endpoint' => false,
        ]));

        $this->assertFalse($method->invoke($command, [
            'endpoint' => '',
            'use_path_style_endpoint' => false,
        ]));
    }

    public function test_storage_configure_dry_run_reports_garage_bucket_website_command(): void
    {
        config([
            'filesystems.disks.s3.driver' => 's3',
            'filesystems.disks.s3.bucket' => 'app',
            'filesystems.disks.s3.region' => 'garage',
            'filesystems.disks.s3.endpoint' => 'http://garage:3900',
            'filesystems.s3_cors_allowed_origins' => ['http://localhost:5173'],
        ]);

        $this->artisan('storage:configure --dry-run')
            ->expectsOutput('S3 API bucket configuration dry run:')
            ->expectsOutput('bucket=app')
            ->expectsOutput('endpoint=http://garage:3900')
            ->expectsOutput('region=garage')
            ->expectsOutputToContain('localhost:5173')
            ->assertSuccessful();
    }

    public function test_storage_configure_rejects_non_s3_disk(): void
    {
        $this->artisan('storage:configure --disk=local --dry-run')
            ->expectsOutput('Disk [local] must use the s3 driver.')
            ->assertFailed();
    }

    public function test_storage_configure_dry_run_falls_back_to_wildcard_origin_when_empty(): void
    {
        config([
            'filesystems.disks.s3.driver' => 's3',
            'filesystems.disks.s3.bucket' => 'app',
            'filesystems.s3_cors_allowed_origins' => [],
        ]);

        $this->artisan('storage:configure --dry-run')
            ->expectsOutputToContain('"AllowedOrigins":["*"]')
            ->assertSuccessful();
    }

    public function test_storage_configure_fails_when_bucket_missing(): void
    {
        config([
            'filesystems.disks.s3.driver' => 's3',
            'filesystems.disks.s3.bucket' => '',
        ]);

        $this->artisan('storage:configure --dry-run')
            ->expectsOutput('Disk bucket is empty; set AWS_BUCKET.')
            ->assertFailed();
    }
}
