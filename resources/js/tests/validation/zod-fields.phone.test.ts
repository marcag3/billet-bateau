import { describe, it, expect } from 'vitest';
import { zOptionalTrimmedPhone } from '../../validation/zod-fields';

const schema = zOptionalTrimmedPhone('invalid phone');

describe('zOptionalTrimmedPhone', () => {
    it('accepts empty as null', () => {
        expect(schema.parse('')).toBeNull();
        expect(schema.parse('   ')).toBeNull();
    });

    it('accepts Canadian-style and loose international', () => {
        expect(schema.parse('(514) 555-1234')).toBe('(514) 555-1234');
        expect(schema.parse('+1 514 555-1234')).toBe('+1 514 555-1234');
        expect(schema.parse('5145551234')).toBe('5145551234');
    });

    it('rejects letters and overlong values', () => {
        expect(() => schema.parse('asdf')).toThrow();
        expect(() => schema.parse('1'.repeat(41))).toThrow();
    });
});
