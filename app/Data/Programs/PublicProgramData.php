<?php

namespace App\Data\Programs;

use App\Models\Program;
use Spatie\LaravelData\Data;

final class PublicProgramData extends Data
{
    /**
     * @param  array<int, array{uuid: string, name: string, url: string, mime_type: ?string, size: int}>  $images
     */
    public function __construct(
        public string $id,
        public string $name,
        public ?string $description,
        public string $theme_color,
        public string $slug,
        public ?string $line_1,
        public ?string $line_2,
        public ?string $city,
        public ?string $postal_code,
        public ?string $country,
        public array $images,
    ) {}

    public static function fromModel(Program $program): self
    {
        $images = [];

        foreach ($program->getMedia('images') as $media) {
            $images[] = [
                'uuid' => (string) $media->uuid,
                'name' => (string) $media->name,
                'url' => $media->getFullUrl(),
                'mime_type' => $media->mime_type,
                'size' => (int) $media->size,
            ];
        }

        return new self(
            id: (string) $program->getKey(),
            name: (string) $program->name,
            description: $program->description,
            theme_color: (string) $program->theme_color,
            slug: (string) $program->slug,
            line_1: $program->line_1,
            line_2: $program->line_2,
            city: $program->city,
            postal_code: $program->postal_code,
            country: $program->country,
            images: $images,
        );
    }
}
