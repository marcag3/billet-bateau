import { describe, expect, it } from 'vitest';
import {
    PROGRAM_BANNER_FALLBACK_URL,
    programBannerUrlFromObjectKey,
    programBannerUrlFromUrl,
} from '../../utilities/program-banner-url';

describe('programBannerUrlFromUrl', () => {
    it('returns the url when set', () => {
        expect(programBannerUrlFromUrl('https://cdn.example/banner.jpg')).toBe(
            'https://cdn.example/banner.jpg',
        );
    });

    it('returns fallback for null, undefined, or blank', () => {
        expect(programBannerUrlFromUrl(null)).toBe(PROGRAM_BANNER_FALLBACK_URL);
        expect(programBannerUrlFromUrl(undefined)).toBe(PROGRAM_BANNER_FALLBACK_URL);
        expect(programBannerUrlFromUrl('   ')).toBe(PROGRAM_BANNER_FALLBACK_URL);
    });
});

describe('programBannerUrlFromObjectKey', () => {
    it('returns fallback when object key is missing', () => {
        expect(programBannerUrlFromObjectKey(null)).toBe(PROGRAM_BANNER_FALLBACK_URL);
        expect(programBannerUrlFromObjectKey('')).toBe(PROGRAM_BANNER_FALLBACK_URL);
    });
});
