<?php

declare(strict_types=1);

namespace App\Support\ObjectStorage;

final class EtagNormalizer
{
    public static function normalize(?string $etag): ?string
    {
        if ($etag === null) {
            return null;
        }

        $trimmed = trim($etag);

        return $trimmed === '' ? null : trim($trimmed, '"');
    }
}
