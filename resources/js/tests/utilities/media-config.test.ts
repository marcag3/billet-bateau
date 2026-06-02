import { afterEach, describe, expect, it } from 'vitest';
import {
    APP_MEDIA_CONFIG_META_NAME,
    getAppMediaConfig,
    mediaPublicBaseUrl,
    readAppMediaConfigFromMeta,
    resetAppMediaConfig,
    setAppMediaConfig,
    trustedImageOrigins,
} from '../../utilities/media-config';

function setMetaConfig(payload: Record<string, unknown>): void {
    const element = document.createElement('meta');
    element.setAttribute('name', APP_MEDIA_CONFIG_META_NAME);
    element.setAttribute('content', JSON.stringify(payload));
    document.head.appendChild(element);
}

describe('media-config', () => {
    afterEach(() => {
        document.querySelectorAll(`meta[name="${APP_MEDIA_CONFIG_META_NAME}"]`).forEach((node) => {
            node.remove();
        });
        resetAppMediaConfig();
    });

    it('reads public base url and trusted origins from meta', () => {
        setMetaConfig({
            publicBaseUrl: 'https://cdn.example/app',
            trustedImageOrigins: ['https://cdn.example'],
        });

        expect(readAppMediaConfigFromMeta()).toEqual({
            publicBaseUrl: 'https://cdn.example/app',
            trustedImageOrigins: ['https://cdn.example'],
        });
        expect(mediaPublicBaseUrl()).toBe('https://cdn.example/app');
        expect(trustedImageOrigins()).toEqual(['https://cdn.example']);
        expect(getAppMediaConfig()).not.toBeNull();
    });
});
