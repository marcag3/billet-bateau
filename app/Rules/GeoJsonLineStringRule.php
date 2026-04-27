<?php

namespace App\Rules;

use App\Data\PowerSync\Values\GeoJsonLineStringParser;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use InvalidArgumentException;

/**
 * Validates that the value is a non-empty GeoJSON string that parses to a LineString.
 */
final class GeoJsonLineStringRule implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail('The :attribute must be a GeoJSON LineString string.');

            return;
        }

        try {
            GeoJsonLineStringParser::parse($value);
        } catch (InvalidArgumentException $exception) {
            match ($exception->getMessage()) {
                GeoJsonLineStringParser::CODE_EMPTY => $fail('The :attribute is required.'),
                GeoJsonLineStringParser::CODE_INVALID_JSON => $fail('The :attribute must be valid GeoJSON (LineString).'),
                GeoJsonLineStringParser::CODE_NOT_LINE_STRING => $fail('The :attribute must be a GeoJSON LineString.'),
                default => $fail('The :attribute must be a GeoJSON LineString.'),
            };
        }
    }
}
