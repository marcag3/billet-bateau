<?php

namespace App\Data\Programs;

use App\Models\Program;
use Spatie\LaravelData\Data;

final class ProgramData extends Data
{
    /**
     * @param  array<int, array{uuid: string, name: string, url: string, mime_type: ?string, size: int}>  $images
     */
    public function __construct(
        public string $id,
        public int $user_id,
        public string $name,
        public ?string $description,
        public string $theme_color,
        public ?AddressResponseData $address,
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

        $address = null;

        if ($program->address !== null) {
            $address = AddressResponseData::from([
                'line_1' => $program->address->line_1,
                'line_2' => $program->address->line_2,
                'city' => $program->address->city,
                'postal_code' => $program->address->postal_code,
                'country' => $program->address->country,
            ]);
        }

        return new self(
            id: (string) $program->getKey(),
            user_id: (int) $program->user_id,
            name: (string) $program->name,
            description: $program->description,
            theme_color: (string) $program->theme_color,
            address: $address,
            images: $images,
        );
    }
}
