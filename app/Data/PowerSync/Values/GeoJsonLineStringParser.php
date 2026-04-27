<?php

namespace App\Data\PowerSync\Values;

use App\Rules\GeoJsonLineStringRule;
use Clickbar\Magellan\Data\Geometries\LineString;
use Clickbar\Magellan\Facades\GeojsonParser;
use InvalidArgumentException;

/**
 * Parses a GeoJSON string into a {@see LineString}. Used by validation rules and DTO casts.
 *
 * Exception messages are machine codes consumed by {@see GeoJsonLineStringRule}.
 */
final class GeoJsonLineStringParser
{
    public const string CODE_EMPTY = 'GEO_JSON_LINE_STRING_EMPTY';

    public const string CODE_INVALID_JSON = 'GEO_JSON_LINE_STRING_INVALID_JSON';

    public const string CODE_NOT_LINE_STRING = 'GEO_JSON_LINE_STRING_NOT_LINE_STRING';

    public static function parse(string $value): LineString
    {
        $trimmed = trim($value);
        if ($trimmed === '') {
            throw new InvalidArgumentException(self::CODE_EMPTY);
        }

        try {
            $geometry = GeojsonParser::parse($trimmed);
        } catch (\Throwable) {
            throw new InvalidArgumentException(self::CODE_INVALID_JSON);
        }

        if (! $geometry instanceof LineString) {
            throw new InvalidArgumentException(self::CODE_NOT_LINE_STRING);
        }

        return $geometry;
    }
}
