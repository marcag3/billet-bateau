<?php

namespace App\Data\PowerSync\Casts;

use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Support\Creation\CreationContext;
use Spatie\LaravelData\Support\DataProperty;

/**
 * Normalizes theme colors to uppercase hex with leading {@code #}.
 */
final class ThemeColorCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $properties, CreationContext $context): string
    {
        if ($value === null) {
            return '#000000';
        }

        if (! is_string($value)) {
            return '#000000';
        }

        $trimmed = trim($value);

        if ($trimmed === '') {
            return '#000000';
        }

        return strtoupper($trimmed);
    }
}
