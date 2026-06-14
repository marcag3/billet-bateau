import { afterEach, describe, expect, it } from 'vitest';
import {
    APP_MEDIA_CONFIG_META_NAME,
    resetAppMediaConfig,
    setAppMediaConfig,
} from '../../utilities/media-config';
import { mediaObjectPublicUrl } from '../../utilities/media-url';

describe('mediaObjectPublicUrl', () => {
    afterEach(() => {
        document.querySelectorAll(`meta[name="${APP_MEDIA_CONFIG_META_NAME}"]`).forEach((node) => {
            node.remove();
        });
        resetAppMediaConfig();
    });

    it('builds a url from runtime config', () => {
        setAppMediaConfig({
            publicBaseUrl: 'http://localhost:9000/app',
            trustedImageOrigins: ['http://localhost:9000'],
        });

        expect(mediaObjectPublicUrl('uploads/abc.jpg')).toBe(
            'http://localhost:9000/app/uploads/abc.jpg',
        );
    });

    it('uses vitest fallback when meta is absent', () => {
        expect(mediaObjectPublicUrl('uploads/abc.jpg')).toBe(
            'http://localhost:9000/app/uploads/abc.jpg',
        );
    });
});
