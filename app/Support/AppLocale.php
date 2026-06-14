<?php

namespace App\Support;

final class AppLocale
{
    public const string Default = 'en';

    /**
     * @return 'en'|'fr'
     */
    public static function normalize(?string $locale): string
    {
        if (is_string($locale) && strtolower($locale) === 'fr') {
            return 'fr';
        }

        return self::Default;
    }
}
