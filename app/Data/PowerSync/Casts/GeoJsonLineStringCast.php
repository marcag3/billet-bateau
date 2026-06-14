<?php

namespace App\Data\PowerSync\Casts;

use App\Data\PowerSync\Values\GeoJsonLineStringParser;
use Clickbar\Magellan\Data\Geometries\LineString;
use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Support\Creation\CreationContext;
use Spatie\LaravelData\Support\DataProperty;

/**
 * Casts a validated GeoJSON LineString string into a {@see LineString} instance.
 */
final class GeoJsonLineStringCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $properties, CreationContext $context): LineString
    {
        if (! is_string($value)) {
            throw new \InvalidArgumentException('Trace must be a GeoJSON LineString string.');
        }

        return GeoJsonLineStringParser::parse($value);
    }
}
