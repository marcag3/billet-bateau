<?php

namespace App\Data\Programs;

use App\Models\Program;
use Spatie\LaravelData\Data;

final class ProgramData extends Data
{
    public function __construct(
        public string $id,
        public int $user_id,
        public string $name,
        public ?string $description,
        public string $theme_color,
        public bool $is_active,
        public string $slug,
        public ?AddressResponseData $address,
    ) {}

    public static function fromModel(Program $program): self
    {
        $address = null;

        if ($program->address !== null) {
            $address = AddressResponseData::from([
                'id' => (string) $program->address->getKey(),
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
            is_active: (bool) $program->is_active,
            slug: $program->slug,
            address: $address,
        );
    }
}
