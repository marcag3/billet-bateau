<?php

namespace App\Data\PowerSync\Support;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * Validates merged inner {@code data.*} payloads with keys prefixed as {@code data.field}.
 */
final class PowerSyncCrudInnerDataValidator
{
    /**
     * @param  array<string, mixed>  $values  Flat field => value (e.g. {@code ['capacity' => 5]}).
     * @param  array<string, mixed>  $rules  Laravel rules keyed by field name without {@code data.} prefix.
     */
    public static function validate(array $values, array $rules): void
    {
        $payload = ['data' => $values];
        $prefixedRules = [];
        foreach ($rules as $field => $fieldRules) {
            $prefixedRules['data.'.$field] = $fieldRules;
        }

        $validator = Validator::make($payload, $prefixedRules);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }
}
