import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { COUNTRY_CODES } from '../data/country-codes';

export const DEFAULT_COUNTRY_CODE = 'CA';

export type CountryOption = {
    value: string;
    label: string;
};

const displayNamesCache = new Map<string, Intl.DisplayNames>();

function getDisplayNames(locale: string): Intl.DisplayNames {
    const key = locale.startsWith('fr') ? 'fr' : 'en';
    let cached = displayNamesCache.get(key);
    if (cached == null) {
        cached = new Intl.DisplayNames([key], { type: 'region' });
        displayNamesCache.set(key, cached);
    }

    return cached;
}

export function localizedCountryLabel(code: string, locale: string): string {
    try {
        const label = getDisplayNames(locale).of(code);
        if (label != null && label.length > 0 && label !== code) {
            return label;
        }
    } catch {
        // Intl may be unavailable in some environments.
    }

    return code;
}

export function buildCountryOptions(locale: string): CountryOption[] {
    return sortCountryOptions(
        COUNTRY_CODES.map((code) => ({
            value: code,
            label: localizedCountryLabel(code, locale),
        })),
        locale,
    );
}

export function sortCountryOptions(
    options: CountryOption[],
    locale: string,
): CountryOption[] {
    const collator = new Intl.Collator(locale, { sensitivity: 'base' });

    return [...options].sort((a, b) => collator.compare(a.label, b.label));
}

export function getFallbackCountryOptions(locale: string): CountryOption[] {
    const label = localizedCountryLabel(DEFAULT_COUNTRY_CODE, locale);

    return [{ value: DEFAULT_COUNTRY_CODE, label }];
}

export function useCountryOptions() {
    const { locale } = useI18n();

    const options = computed((): CountryOption[] => buildCountryOptions(String(locale.value)));

    return {
        options,
        loading: computed(() => false),
    };
}
