<?php

namespace App\Models;

use App\Support\MediaProgramContext;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Context;
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
            $fromContext = Context::get(MediaProgramContext::KEY);

            if (! is_string($fromContext) || $fromContext === '') {
                throw new LogicException('Missing media program context: wrap media creation in MediaProgramContext::run().');
            }

            $media->program_id = $fromContext;
        });
    }

    /**
     * @return BelongsTo<Program, $this>
     */
    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }
}
