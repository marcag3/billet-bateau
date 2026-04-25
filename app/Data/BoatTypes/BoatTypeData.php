<?php

namespace App\Data\BoatTypes;

use App\Models\BoatType;
use Spatie\LaravelData\Data;

final class BoatTypeData extends Data
{
    /**
     * @param  array<int, array{uuid: string, name: string, url: string, mime_type: ?string, size: int}>  $images
     */
    public function __construct(
        public string $id,
        public int $user_id,
        public string $name,
        public array $images,
    ) {}

    public static function fromModel(BoatType $boatType): self
    {
        $images = [];

        foreach ($boatType->getMedia('images') as $media) {
            $images[] = [
                'uuid' => (string) $media->uuid,
                'name' => (string) $media->name,
                'url' => $media->getFullUrl(),
                'mime_type' => $media->mime_type,
                'size' => (int) $media->size,
            ];
        }

        return new self(
            id: (string) $boatType->getKey(),
            user_id: (int) $boatType->user_id,
            name: (string) $boatType->name,
            images: $images,
        );
    }
}
