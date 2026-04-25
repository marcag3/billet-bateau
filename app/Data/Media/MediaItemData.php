<?php

namespace App\Data\Media;

use Spatie\LaravelData\Data;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

final class MediaItemData extends Data
{
    public function __construct(
        public string $uuid,
        public string $name,
        public string $url,
        public ?string $mime_type,
        public int $size,
    ) {}

    public static function fromMedia(Media $media): self
    {
        return new self(
            uuid: (string) $media->uuid,
            name: (string) $media->name,
            url: $media->getFullUrl(),
            mime_type: $media->mime_type,
            size: (int) $media->size,
        );
    }
}
