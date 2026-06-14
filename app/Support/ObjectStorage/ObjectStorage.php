<?php

declare(strict_types=1);

namespace App\Support\ObjectStorage;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Filesystem\FilesystemManager;

final class ObjectStorage
{
    public function __construct(
        private readonly FilesystemManager $filesystem,
        private readonly string $diskName = 's3',
    ) {}

    public function disk(): FilesystemAdapter
    {
        $disk = $this->filesystem->disk($this->diskName);
        assert($disk instanceof FilesystemAdapter);

        return $disk;
    }

    /**
     * Presigned PUT URL and headers. Uses the configured disk when the S3 API endpoint matches
     * the presign endpoint; otherwise builds an on-demand client that targets the browser-reachable
     * endpoint (see `filesystems.s3_presign_endpoint`).
     *
     * @param  array<string, mixed>  $putOptions  S3 PutObject options (ContentType, CacheControl, etc.)
     * @return array{url: string, headers: array<string, string>}
     */
    public function temporaryPutUrl(string $objectKey, array $putOptions = []): array
    {
        $presignDisk = $this->presignDisk();

        $signed = $presignDisk->temporaryUploadUrl(
            $objectKey,
            now()->addMinutes(15),
            $putOptions,
        );

        $headers = [];
        foreach ($signed['headers'] as $name => $value) {
            if (is_array($value)) {
                $headers[$name] = implode(',', $value);
            } else {
                $headers[$name] = (string) $value;
            }
        }

        return [
            'url' => $signed['url'],
            'headers' => $headers,
        ];
    }

    public function objectExists(string $objectKey): bool
    {
        return $this->disk()->exists($objectKey);
    }

    public function delete(?string $objectKey): void
    {
        if ($objectKey === null || $objectKey === '') {
            return;
        }

        $this->disk()->delete($objectKey);
    }

    private function presignDisk(): FilesystemAdapter
    {
        /** @var array<string, mixed> $diskConfig */
        $diskConfig = config('filesystems.disks.'.$this->diskName, []);

        $resolvedPresign = (string) config('filesystems.s3_presign_endpoint', '');
        $apiEndpoint = (string) ($diskConfig['endpoint'] ?? '');

        if ($resolvedPresign === '' || $resolvedPresign === $apiEndpoint) {
            return $this->disk();
        }

        $built = $this->filesystem->build(array_merge($diskConfig, [
            'endpoint' => $resolvedPresign,
            'use_path_style_endpoint' => true,
        ]));
        assert($built instanceof FilesystemAdapter);

        return $built;
    }
}
