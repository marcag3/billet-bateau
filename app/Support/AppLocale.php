<?php

namespace App\Support;

final class AppLocale
{
    public const string Default = 'fr';

    /**
     * @return 'en'|'fr'
     */
    public static function normalize(?string $locale): string
    {
        if (is_string($locale) && strtolower($locale) === 'en') {
            return 'en';
        }

        return self::Default;
    }
}
