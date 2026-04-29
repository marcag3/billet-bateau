<?php

namespace App\Support;

use App\Models\Media;
use Illuminate\Support\Facades\Context;

/**
 * Request-scoped program id for Spatie media creation.
 *
 * {@see Media} copies this into {@see Media::$program_id} on {@see Media::creating}.
 */
final class MediaProgramContext
{
    public const string KEY = 'media.resolved_program_id';

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public static function run(string $programId, callable $callback): mixed
    {
        Context::add(self::KEY, $programId);

        try {
            return $callback();
        } finally {
            Context::forget(self::KEY);
        }
    }
}
