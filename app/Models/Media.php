<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;
use Spatie\MediaLibrary\MediaCollections\Models\Media as BaseMedia;

/**
 * Media row scoped to a program for offline sync rules.
 *
 * @property string $program_id
 */
class Media extends BaseMedia
{
    protected static function booted(): void
    {
        static::creating(function (Media $media): void {
            $programId = self::resolveProgramIdForMorph((string) $media->model_type, $media->model_id);

            if ($programId === '') {
                throw new LogicException('Unable to resolve media program id for attachable.');
            }

            $media->program_id = $programId;
        });
    }

    /**
     * @param  mixed  $modelId
     */
    private static function resolveProgramIdForMorph(string $modelType, $modelId): string
    {
        return match ($modelType) {
            Program::class => (string) $modelId,
            BoatType::class => self::boatTypeProgramId((string) $modelId),
            default => throw new LogicException('Unsupported media attachable model type: '.$modelType.'.'),
        };
    }

    private static function boatTypeProgramId(string $boatTypeId): string
    {
        $programId = BoatType::query()->whereKey($boatTypeId)->value('program_id');

        if (! is_string($programId) || $programId === '') {
            throw new LogicException('Boat type media attachable is missing a program id.');
        }

        return $programId;
    }

    /**
     * @return BelongsTo<Program, $this>
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }
}
