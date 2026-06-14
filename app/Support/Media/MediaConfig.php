<?php

declare(strict_types=1);

namespace App\Support\Media;

final class MediaConfig
{
    /**
     * Browser-facing base URL for public object keys (no trailing slash).
     */
    public static function publicBaseUrl(): string
    {
        return rtrim((string) config('media.public_base_url', ''), '/');
    }

    /**
     * Origins allowed for cross-origin image caching in the app service worker.
     *
     * @return list<string>
     */
    public static function trustedImageOrigins(): array
    {
        $origins = [];

        $base = self::publicBaseUrl();
        if ($base !== '') {
            $origin = self::originFromUrl($base);
            if ($origin !== null) {
                $origins[] = $origin;
            }
        }

        $extra = config('media.trusted_origins');
        if (is_string($extra) && $extra !== '') {
            foreach (explode(',', $extra) as $part) {
                $trimmed = trim($part);
                if ($trimmed === '') {
                    continue;
                }

                $origin = str_contains($trimmed, '://')
                    ? self::originFromUrl($trimmed)
                    : $trimmed;

                if ($origin !== null) {
                    $origins[] = $origin;
                }
            }
        }

        return array_values(array_unique($origins));
    }

    /**
     * @return array{publicBaseUrl: string, trustedImageOrigins: list<string>}
     */
    public static function serviceWorkerPayload(): array
    {
        return [
            'publicBaseUrl' => self::publicBaseUrl(),
            'trustedImageOrigins' => self::trustedImageOrigins(),
        ];
    }

    private static function originFromUrl(string $url): ?string
    {
        $parts = parse_url($url);
        if ($parts === false || ! isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        $origin = $parts['scheme'].'://'.$parts['host'];
        if (isset($parts['port'])) {
            $origin .= ':'.$parts['port'];
        }

        return $origin;
    }
}
