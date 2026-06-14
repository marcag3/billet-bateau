import { describe, it, expect } from 'vitest';
import {
    DEFAULT_COUNTRY_CODE,
    getFallbackCountryOptions,
    mapRestCountriesToOptions,
    sortCountryOptions,
    type RestCountryRow,
} from '../../composables/useCountryOptions';

const sampleCountries: RestCountryRow[] = [
    {
        cca2: 'US',
        name: { common: 'United States' },
        translations: { fra: { common: 'États-Unis' } },
    },
    {
        cca2: 'CA',
        name: { common: 'Canada' },
        translations: { fra: { common: 'Canada' } },
    },
];

describe('useCountryOptions helpers', () => {
    it('maps REST countries to ISO options with English labels', () => {
        const options = mapRestCountriesToOptions(sampleCountries, 'en');

        expect(options).toEqual([
            { value: 'US', label: 'United States' },
            { value: 'CA', label: 'Canada' },
        ]);
    });

    it('maps REST countries to French labels when locale is fr', () => {
        const options = mapRestCountriesToOptions(sampleCountries, 'fr');

        expect(options).toEqual([
            { value: 'US', label: 'États-Unis' },
            { value: 'CA', label: 'Canada' },
        ]);
    });

    it('sorts options alphabetically for the active locale', () => {
        const sorted = sortCountryOptions(
            mapRestCountriesToOptions(sampleCountries, 'en'),
            'en',
        );

        expect(sorted.map((option) => option.value)).toEqual(['CA', 'US']);
    });

    it('returns Canada-only fallback options', () => {
        expect(getFallbackCountryOptions('en')).toEqual([
            { value: DEFAULT_COUNTRY_CODE, label: 'Canada' },
        ]);
    });
});
