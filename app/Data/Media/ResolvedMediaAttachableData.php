<?php

namespace App\Data\Media;

use App\Models\BoatType;
use App\Models\Program;

final readonly class ResolvedMediaAttachableData
{
    public function __construct(
        public Program|BoatType $attachable,
        public Program $program,
        public string $programId,
    ) {}
}
