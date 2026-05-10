<?php

namespace App\Data\Programs;

use App\Models\Program;
use Spatie\LaravelData\Data;

final class PublicProgramSummaryData extends Data
{
    public function __construct(
        public string $id,
        public string $name,
        public ?string $description,
        public string $theme_color,
        public string $slug,
        public ?string $image_url,
        public string $path_segment,
    ) {}

    public static function fromModel(Program $program): self
    {
        $pathSegment = (string) $program->slug;

        return new self(
            id: (string) $program->getKey(),
            name: (string) $program->name,
            description: $program->description,
            theme_color: (string) $program->theme_color,
            slug: (string) $program->slug,
            image_url: $program->getImageUrl('banner'),
            path_segment: $pathSegment,
        );
    }
}
