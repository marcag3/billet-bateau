<?php

namespace App\Data\PowerSync\Casts;

use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Support\Creation\CreationContext;
use Spatie\LaravelData\Support\DataProperty;

/**
 * Coerces request-style boolean representations to a real boolean.
 */
final class LooseBooleanCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $properties, CreationContext $context): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value)) {
            return $value !== 0;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));

            return match ($normalized) {
                '1', 'true', 'yes', 'on' => true,
                default => false,
            };
        }

        return false;
    }
}
