<?php

namespace App\Support;

use App\Models\Program;
use Carbon\CarbonInterface;

final class ProgramTimezone
{
    public const string DEFAULT = 'America/Toronto';

    public static function resolve(?Program $program): string
    {
        $timezone = trim((string) ($program?->timezone ?? ''));

        if ($timezone !== '' && in_array($timezone, timezone_identifiers_list(), true)) {
            return $timezone;
        }

        return self::DEFAULT;
    }

    public static function formatDeparture(
        ?CarbonInterface $departure,
        string $locale,
        ?Program $program,
    ): string {
        if ($departure === null) {
            return '—';
        }

        return $departure
            ->timezone(self::resolve($program))
            ->locale($locale)
            ->isoFormat(
                $locale === 'fr'
                    ? 'dddd D MMMM YYYY [à] HH:mm'
                    : 'dddd, MMMM D, YYYY [at] h:mm A',
            );
    }

    public static function formatDateTime(
        ?CarbonInterface $instant,
        string $locale,
        ?Program $program,
    ): string {
        if ($instant === null) {
            return '—';
        }

        return $instant
            ->timezone(self::resolve($program))
            ->locale($locale)
            ->isoFormat(
                $locale === 'fr'
                    ? 'dddd D MMMM YYYY [à] HH:mm'
                    : 'dddd, MMMM D, YYYY [at] h:mm A',
            );
    }
}
