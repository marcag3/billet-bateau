import { describe, expect, it } from 'vitest';
import {
    canInviteProgramAdmins,
    isProgramOwner,
    resolveCurrentProgramMembershipRole,
} from '../../utilities/program-membership';

describe('resolveCurrentProgramMembershipRole', () => {
    const memberships = [
        { program_id: 'prog-1', user_id: 'user-owner', role: 'owner' },
        { program_id: 'prog-1', user_id: 'user-admin', role: 'admin' },
    ];

    it('returns the role for the matching program and user', () => {
        expect(
            resolveCurrentProgramMembershipRole(
                memberships,
                'prog-1',
                'user-owner',
            ),
        ).toBe('owner');
        expect(
            resolveCurrentProgramMembershipRole(
                memberships,
                'prog-1',
                'user-admin',
            ),
        ).toBe('admin');
    });

    it('returns null when no row matches the current user', () => {
        expect(
            resolveCurrentProgramMembershipRole(
                memberships,
                'prog-1',
                'user-other',
            ),
        ).toBeNull();
    });

    it('returns null for empty program or user id', () => {
        expect(
            resolveCurrentProgramMembershipRole(memberships, '', 'user-owner'),
        ).toBeNull();
        expect(
            resolveCurrentProgramMembershipRole(memberships, 'prog-1', ''),
        ).toBeNull();
    });
});

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
