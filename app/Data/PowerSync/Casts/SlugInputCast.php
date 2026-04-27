<?php

namespace App\Data\PowerSync\Casts;

use App\Data\PowerSync\Values\SlugNormalizer;
use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Support\Creation\CreationContext;
use Spatie\LaravelData\Support\DataProperty;

/**
 * Normalizes arbitrary scalar input into a URL-safe slug string or {@code null} when empty.
 */
final class SlugInputCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $properties, CreationContext $context): ?string
    {
        return SlugNormalizer::normalize($value);
    }
}
