import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

export const DEFAULT_COUNTRY_CODE = 'CA';

const REST_COUNTRIES_URL =
    'https://restcountries.com/v3.1/all?fields=cca2,name,translations';

const CACHE_KEY = 'billlet-bateau:country-options:v1';

export type CountryOption = {
    value: string;
    label: string;
};

export type RestCountryRow = {
    cca2: string;
    name: { common: string };
    translations?: {
        fra?: { common: string };
    };
};

function localizedCountryName(row: RestCountryRow, locale: string): string {
    if (locale.startsWith('fr')) {
        const french = row.translations?.fra?.common?.trim();
        if (french != null && french.length > 0) {
            return french;
        }
    }

    return row.name.common.trim();
}

export function mapRestCountriesToOptions(
    countries: RestCountryRow[],
    locale: string,
): CountryOption[] {
    return countries
        .filter((row) => typeof row.cca2 === 'string' && row.cca2.length === 2)
        .map((row) => ({
            value: row.cca2.toUpperCase(),
            label: localizedCountryName(row, locale),
        }));
}

export function sortCountryOptions(
    options: CountryOption[],
    locale: string,
): CountryOption[] {
    const collator = new Intl.Collator(locale, { sensitivity: 'base' });

    return [...options].sort((a, b) => collator.compare(a.label, b.label));
}

export function getFallbackCountryOptions(locale: string): CountryOption[] {
    const label = locale.startsWith('fr') ? 'Canada' : 'Canada';

    return [{ value: DEFAULT_COUNTRY_CODE, label }];
}

function readCachedCountries(): RestCountryRow[] | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw == null || raw.length === 0) {
            return null;
        }

        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
            return null;
        }

        return parsed as RestCountryRow[];
    } catch {
        return null;
    }
}

function writeCachedCountries(countries: RestCountryRow[]): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(countries));
    } catch {
        // Ignore quota / private mode errors.
    }
}

async function fetchRestCountries(): Promise<RestCountryRow[]> {
    const response = await fetch(REST_COUNTRIES_URL);
    if (!response.ok) {
        throw new Error(`Failed to load countries (${response.status})`);
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
        throw new Error('Invalid countries payload');
    }

    return payload as RestCountryRow[];
}

export function useCountryOptions() {
    const { locale } = useI18n();
    const loading = ref(false);
    const rawCountries = ref<RestCountryRow[] | null>(readCachedCountries());

    const options = computed((): CountryOption[] => {
        const localeValue = String(locale.value);
        const source = rawCountries.value;

        if (source == null || source.length === 0) {
            return getFallbackCountryOptions(localeValue);
        }

        return sortCountryOptions(
            mapRestCountriesToOptions(source, localeValue),
            localeValue,
        );
    });

    async function loadCountries(): Promise<void> {
        if (loading.value) {
            return;
        }

        loading.value = true;
        try {
            const countries = await fetchRestCountries();
            rawCountries.value = countries;
            writeCachedCountries(countries);
        } catch {
            if (rawCountries.value == null || rawCountries.value.length === 0) {
                rawCountries.value = null;
            }
        } finally {
            loading.value = false;
        }
    }

    onMounted(() => {
        void loadCountries();
    });

    watch(locale, () => {
        // Recompute labels via computed; no refetch needed.
    });

    return {
        options,
        loading,
        loadCountries,
    };
}
