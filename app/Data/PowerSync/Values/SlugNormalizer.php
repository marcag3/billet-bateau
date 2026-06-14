<?php

namespace App\Data\PowerSync\Values;

use Illuminate\Support\Str;

/**
 * Normalizes arbitrary scalar input into a URL-safe slug string or {@code null} when empty.
 */
final class SlugNormalizer
{
    private const int SLUG_MAX_LENGTH = 200;

    public static function normalize(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_string($value) && trim($value) === '') {
            return null;
        }

        if (! is_scalar($value)) {
            return null;
        }

        $asString = is_string($value) ? trim($value) : (string) $value;
        if ($asString === '') {
            return null;
        }

        $slug = Str::slug(Str::ascii($asString));
        if ($slug === '') {
            return null;
        }

        if (mb_strlen($slug) > self::SLUG_MAX_LENGTH) {
            $slug = Str::limit($slug, self::SLUG_MAX_LENGTH, '');
        }

        return Str::lower($slug);
    }
}
