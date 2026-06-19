import { describe, expect, it } from 'vitest';
import {
    canInviteProgramAdmins,
    isProgramOwner,
} from '../../utilities/program-membership';

describe('isProgramOwner', () => {
    it('returns true for owner role', () => {
        expect(isProgramOwner('owner')).toBe(true);
    });

    it('returns false for admin role', () => {
        expect(isProgramOwner('admin')).toBe(false);
    });

    it('returns false for null or undefined', () => {
        expect(isProgramOwner(null)).toBe(false);
        expect(isProgramOwner(undefined)).toBe(false);
    });
});

describe('canInviteProgramAdmins', () => {
    it('returns true for owner role', () => {
        expect(canInviteProgramAdmins('owner')).toBe(true);
    });

    it('returns false for admin role', () => {
        expect(canInviteProgramAdmins('admin')).toBe(false);
    });

    it('returns false for null or undefined', () => {
        expect(canInviteProgramAdmins(null)).toBe(false);
        expect(canInviteProgramAdmins(undefined)).toBe(false);
    });
});
