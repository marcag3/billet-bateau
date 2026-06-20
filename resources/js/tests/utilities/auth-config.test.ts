import { afterEach, describe, expect, it } from 'vitest';
import {
    APP_AUTH_CONFIG_META_NAME,
    getAppAuthConfig,
    readAppAuthConfigFromMeta,
    resetAppAuthConfig,
} from '../../utilities/auth-config';

function setMetaConfig(content: string): void {
    const element = document.createElement('meta');
    element.setAttribute('name', APP_AUTH_CONFIG_META_NAME);
    element.setAttribute('content', content);
    document.head.appendChild(element);
}

describe('auth-config', () => {
    afterEach(() => {
        document.querySelectorAll(`meta[name="${APP_AUTH_CONFIG_META_NAME}"]`).forEach((node) => {
            node.remove();
        });
        resetAppAuthConfig();
    });

    it('reads google_oauth_enabled from meta json', () => {
        setMetaConfig('{"google_oauth_enabled":true}');

        expect(readAppAuthConfigFromMeta()).toEqual({
            google_oauth_enabled: true,
        });
        expect(getAppAuthConfig().google_oauth_enabled).toBe(true);
    });

    it('defaults to disabled when meta is missing', () => {
        expect(getAppAuthConfig()).toEqual({
            google_oauth_enabled: false,
        });
    });
});
