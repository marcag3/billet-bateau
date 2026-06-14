<?php

declare(strict_types=1);

namespace App\Models\Concerns;

trait ResolvesMediaUrl
{
    /**
     * Public URL for an object storage key (no SDK).
     *
     * Canonical base URL is {@see config('media.public_base_url')} (`config/media.php`). Set it to
     * the same browser-reachable base as your public object storage (e.g. `filesystems.disks.s3.url` / `AWS_URL`).
     */
    public static function mediaUrlFromKey(string $key): string
    {
        $base = rtrim((string) config('media.public_base_url', ''), '/');

        return $base.'/'.ltrim($key, '/');
    }

    /**
     * Public URL for a stored image slot (e.g. {@code banner} → {@code banner_object_key}).
     */
    public function getImageUrl(string $slot): ?string
    {
        $attribute = match ($slot) {
            'banner' => 'banner_object_key',
            default => null,
        };

        if ($attribute === null) {
            return null;
        }

        $key = $this->getAttribute($attribute);

        if (! is_string($key) || $key === '') {
            return null;
        }

        return static::mediaUrlFromKey($key);
    }
}
