<?php

namespace App\Data\PowerSync\Casts;

use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Support\Creation\CreationContext;
use Spatie\LaravelData\Support\DataProperty;

/**
 * Trims a string payload; non-strings become an empty string.
 */
final class TrimmedStringCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $properties, CreationContext $context): string
    {
        if (! is_string($value)) {
            return '';
        }

        return trim($value);
    }
}
