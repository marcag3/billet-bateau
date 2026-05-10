<?php

declare(strict_types=1);

namespace App\Support\Media;

use Illuminate\Support\Str;
use InvalidArgumentException;

final class ImageUpload
{
    /** @var list<string> */
    public const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    public const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

    public const OBJECT_KEY_REGEX = '/^uploads\/[0-9A-HJKMNP-TV-Z]{26}\.(jpeg|jpg|png|webp)$/i';

    /** @var array<string, string> */
    private const MIME_TO_EXTENSION = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public static function extensionForMime(string $mimeType): string
    {
        return self::MIME_TO_EXTENSION[$mimeType]
            ?? throw new InvalidArgumentException('Unsupported image MIME type: '.$mimeType.'.');
    }

    public static function objectKeyForMime(string $mimeType): string
    {
        return 'uploads/'.Str::ulid().'.'.self::extensionForMime($mimeType);
    }

    public static function objectKeyValidationRule(): string
    {
        return 'regex:'.self::OBJECT_KEY_REGEX;
    }
}
