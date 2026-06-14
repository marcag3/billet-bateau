import { describe, expect, it } from 'vitest';
import { fileMatchesAccept } from '../../utilities/image-accept';

function file(name: string, type: string): File {
    return new File(['x'], name, { type });
}

describe('fileMatchesAccept', () => {
    it('accepts exact mime types', () => {
        const accept = 'image/jpeg,image/png,image/webp';

        expect(fileMatchesAccept(file('a.jpg', 'image/jpeg'), accept)).toBe(true);
        expect(fileMatchesAccept(file('a.png', 'image/png'), accept)).toBe(true);
        expect(fileMatchesAccept(file('a.webp', 'image/webp'), accept)).toBe(true);
        expect(fileMatchesAccept(file('a.gif', 'image/gif'), accept)).toBe(false);
    });

    it('accepts wildcard mime prefixes', () => {
        expect(fileMatchesAccept(file('a.jpg', 'image/jpeg'), 'image/*')).toBe(true);
        expect(fileMatchesAccept(file('a.pdf', 'application/pdf'), 'image/*')).toBe(false);
    });

    it('accepts file extensions', () => {
        expect(fileMatchesAccept(file('photo.JPG', ''), '.jpg,.png')).toBe(true);
        expect(fileMatchesAccept(file('photo.gif', ''), '.jpg,.png')).toBe(false);
    });

    it('allows all files when accept is empty', () => {
        expect(fileMatchesAccept(file('a.bin', 'application/octet-stream'), '')).toBe(true);
    });
});
