<?php

namespace App\Data\Programs;

use App\Models\Program;
use Spatie\LaravelData\Data;

final class PublicProgramData extends Data
{
    public function __construct(
        public string $id,
        public string $name,
        public ?string $description,
        public string $theme_color,
        public string $slug,
        public string $start_date,
        public string $end_date,
        public ?string $line_1,
        public ?string $line_2,
        public ?string $city,
        public ?string $postal_code,
        public ?string $country,
        public string $timezone,
        public ?string $banner_url,
        public ?string $banner_mime_type,
    ) {}

    public static function fromModel(Program $program): self
    {
        return new self(
            id: (string) $program->getKey(),
            name: (string) $program->name,
            description: $program->description,
            theme_color: (string) $program->theme_color,
            slug: (string) $program->slug,
            start_date: $program->start_date->format('Y-m-d'),
            end_date: $program->end_date->format('Y-m-d'),
            line_1: $program->line_1,
            line_2: $program->line_2,
            city: $program->city,
            postal_code: $program->postal_code,
            country: $program->country,
            timezone: (string) $program->timezone,
            banner_url: $program->getImageUrl('banner'),
            banner_mime_type: $program->banner_mime_type,
        );
    }
}
