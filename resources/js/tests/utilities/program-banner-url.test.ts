import { afterEach, describe, expect, it } from 'vitest';
import {
    APP_MEDIA_CONFIG_META_NAME,
    resetAppMediaConfig,
    setAppMediaConfig,
} from '../../utilities/media-config';
import {
    PROGRAM_BANNER_FALLBACK_URL,
    programBannerPreviewUrlFromObjectKey,
    programBannerUrlFromObjectKey,
    programBannerUrlFromUrl,
} from '../../utilities/program-banner-url';

afterEach(() => {
    document.querySelectorAll(`meta[name="${APP_MEDIA_CONFIG_META_NAME}"]`).forEach((node) => {
        node.remove();
    });
    resetAppMediaConfig();
});

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

describe('programBannerPreviewUrlFromObjectKey', () => {
    it('returns empty when object key is missing', () => {
        expect(programBannerPreviewUrlFromObjectKey(null)).toBe('');
        expect(programBannerPreviewUrlFromObjectKey('')).toBe('');
        expect(programBannerPreviewUrlFromObjectKey('   ')).toBe('');
    });

    it('returns fallback when key is set but media base is missing', () => {
        setAppMediaConfig({ publicBaseUrl: '', trustedImageOrigins: [] });
        expect(programBannerPreviewUrlFromObjectKey('uploads/x.jpg')).toBe(
            PROGRAM_BANNER_FALLBACK_URL,
        );
    });
});
