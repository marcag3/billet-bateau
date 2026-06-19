<?php

declare(strict_types=1);

namespace App\Support\Auth;

final class SafeRedirectPath
{
    public static function sanitize(?string $path, string $default = '/app'): string
    {
        if ($path === null || $path === '') {
            return $default;
        }

        $path = trim($path);

        if (! str_starts_with($path, '/') || str_starts_with($path, '//')) {
            return $default;
        }

        if (str_contains($path, '\\') || str_contains($path, "\0")) {
            return $default;
        }

        return $path;
    }
}
