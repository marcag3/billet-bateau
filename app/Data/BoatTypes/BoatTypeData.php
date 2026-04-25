<?php

namespace App\Data\BoatTypes;

use App\Models\BoatType;
use Spatie\LaravelData\Data;

final class BoatTypeData extends Data
{
    public function __construct(
        public string $id,
        public int $user_id,
        public string $name,
    ) {}

    public static function fromModel(BoatType $boatType): self
    {
        return new self(
            id: (string) $boatType->getKey(),
            user_id: (int) $boatType->user_id,
            name: (string) $boatType->name,
        );
    }
}
