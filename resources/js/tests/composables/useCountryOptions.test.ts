import { describe, it, expect } from 'vitest';
import {
    DEFAULT_COUNTRY_CODE,
    buildCountryOptions,
    getFallbackCountryOptions,
    localizedCountryLabel,
    sortCountryOptions,
} from '../../composables/useCountryOptions';

describe('useCountryOptions helpers', () => {
    it('localizes country labels in English', () => {
        expect(localizedCountryLabel('US', 'en')).toBe('United States');
        expect(localizedCountryLabel('CA', 'en')).toBe('Canada');
    });

    it('localizes country labels in French', () => {
        expect(localizedCountryLabel('US', 'fr')).toBe('États-Unis');
        expect(localizedCountryLabel('CA', 'fr')).toBe('Canada');
    });

    it('builds a full country list with localized labels', () => {
        const options = buildCountryOptions('en');

        expect(options.length).toBeGreaterThan(200);
        expect(options.some((option) => option.value === 'US' && option.label === 'United States')).toBe(
            true,
        );
    });

    it('sorts options alphabetically for the active locale', () => {
        const sorted = sortCountryOptions(
            [
                { value: 'US', label: 'United States' },
                { value: 'CA', label: 'Canada' },
            ],
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
