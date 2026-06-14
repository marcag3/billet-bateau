import { describe, expect, it } from 'vitest';
import { canInviteProgramAdmins } from '../../utilities/program-membership';

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
