import { describe, expect, it } from 'vitest';
import { sanitizeRedirectPath } from '../../utilities/safe-redirect-path';

describe('sanitizeRedirectPath', () => {
    it('allows same-origin relative paths', () => {
        expect(sanitizeRedirectPath('/app/programs')).toBe('/app/programs');
    });

    it('rejects external URLs', () => {
        expect(sanitizeRedirectPath('https://evil.example/phish')).toBe('/');
    });

    it('rejects protocol-relative URLs', () => {
        expect(sanitizeRedirectPath('//evil.example/phish')).toBe('/');
    });
});
