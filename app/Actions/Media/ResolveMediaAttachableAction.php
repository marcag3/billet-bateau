<?php

namespace App\Actions\Media;

use App\Data\Media\ResolvedMediaAttachableData;
use App\Models\BoatType;
use App\Models\Program;
use Spatie\MediaLibrary\HasMedia;

final class ResolveMediaAttachableAction
{
    public function run(string $type, string $id): ResolvedMediaAttachableData
    {
        $attachable = match ($type) {
            'program' => Program::query()->find($id),
            'boat_type' => BoatType::query()->find($id),
            default => null,
        };

        if ($attachable === null || ! $attachable instanceof HasMedia) {
            abort(404);
        }

        $programId = match (true) {
            $attachable instanceof Program => (string) $attachable->getKey(),
            $attachable instanceof BoatType => (string) $attachable->program_id,
            default => throw new \LogicException('Unsupported media attachable type.'),
        };

        if ($programId === '') {
            throw new \LogicException('Media attachable is missing a program id.');
        }

        /** @var Program $program */
        $program = Program::query()->findOrFail($programId);

        return new ResolvedMediaAttachableData($attachable, $program, $programId);
    }
}
