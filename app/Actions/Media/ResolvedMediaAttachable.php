<?php

namespace App\Actions\Media;

use App\Models\BoatType;
use App\Models\Program;

final readonly class ResolvedMediaAttachable
{
    public function __construct(
        public Program|BoatType $attachable,
        public Program $program,
        public string $programId,
    ) {}
}
