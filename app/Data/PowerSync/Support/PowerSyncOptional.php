<?php

namespace App\Data\PowerSync\Support;

use Spatie\LaravelData\Optional;

/**
 * Resolves PowerSync PUT payloads where omitted keys are represented as {@see Optional}.
 */
final class PowerSyncOptional
{
    public static function resolve(mixed $dtoValue, mixed $existingValue, mixed $default = null): mixed
    {
        return $dtoValue instanceof Optional ? ($existingValue ?? $default) : $dtoValue;
    }
}
