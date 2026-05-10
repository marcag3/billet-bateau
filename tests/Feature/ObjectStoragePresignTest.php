<?php

namespace Tests\Feature;

use App\Support\ObjectStorage\ObjectStorage;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Filesystem\FilesystemManager;
use Mockery;
use Tests\TestCase;

class ObjectStoragePresignTest extends TestCase
{
    public function test_temporary_put_url_forces_path_style_when_using_custom_presign_endpoint(): void
    {
        config([
            'filesystems.disks.s3.endpoint' => 'http://garage.internal:3900',
            'filesystems.disks.s3.use_path_style_endpoint' => false,
            'filesystems.s3_presign_endpoint' => 'http://garage.public:9000',
        ]);

        $signedDisk = Mockery::mock(FilesystemAdapter::class);
        $signedDisk->shouldReceive('temporaryUploadUrl')
            ->once()
            ->withArgs(function (string $objectKey, mixed $expiresAt, array $putOptions): bool {
                $this->assertSame('uploads/test-image.png', $objectKey);
                $this->assertArrayHasKey('ContentType', $putOptions);

                return true;
            })
            ->andReturn([
                'url' => 'http://garage.public:9000/app/uploads/test-image.png',
                'headers' => [
                    'x-amz-meta-test' => ['value'],
                ],
            ]);

        $filesystem = Mockery::mock(FilesystemManager::class);
        $filesystem->shouldReceive('build')
            ->once()
            ->withArgs(function (array $config): bool {
                $this->assertSame('http://garage.public:9000', $config['endpoint'] ?? null);
                $this->assertTrue((bool) ($config['use_path_style_endpoint'] ?? false));

                return true;
            })
            ->andReturn($signedDisk);

        $storage = new ObjectStorage($filesystem);

        $signed = $storage->temporaryPutUrl('uploads/test-image.png', [
            'ContentType' => 'image/png',
        ]);

        $this->assertSame('http://garage.public:9000/app/uploads/test-image.png', $signed['url']);
        $this->assertSame('value', $signed['headers']['x-amz-meta-test']);
    }
}
