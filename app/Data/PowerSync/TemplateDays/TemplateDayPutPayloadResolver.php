<?php

namespace App\Data\PowerSync\TemplateDays;

use App\Data\PowerSync\Support\PowerSyncOptional;
use App\Models\TemplateDay;

/**
 * Resolves merged PUT attributes for {@see TemplateDay} PowerSync uploads.
 *
 * @return array{name: string}
 */
final class TemplateDayPutPayloadResolver
{
    public static function resolve(TemplateDayPutData $dto, ?TemplateDay $existing): array
    {
        $existingName = $existing !== null ? (string) $existing->name : null;

        $nameMerged = PowerSyncOptional::resolve($dto->name, $existingName, '');
        $nameMerged = is_string($nameMerged) ? $nameMerged : '';

        return [
            'name' => $nameMerged !== '' ? $nameMerged : (string) ($existingName ?? ''),
        ];
    }
}
