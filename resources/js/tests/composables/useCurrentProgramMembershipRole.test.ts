import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

const mockCollectionRef = ref<unknown>({ table: 'program_user' });
const mockCurrentUserIdRef = ref('user-owner');

let lastQueryFn: (queryBuilder: {
    from: (arg: unknown) => { where: (fn: (row: unknown) => unknown) => unknown };
}) => unknown;

vi.mock('../../powersync/app-powersync.runtime', () => ({
    getAppPowerSyncContext: () => ({
        collections: {
            program_user: mockCollectionRef,
        },
        currentUserIdRef: mockCurrentUserIdRef,
    }),
}));

vi.mock('@tanstack/vue-db', () => ({
    useLiveQuery: (
        fn: typeof lastQueryFn,
    ): { data: ReturnType<typeof ref<unknown[]>> } => {
        lastQueryFn = fn;
        return {
            data: ref([
                {
                    program_id: 'prog-1',
                    user_id: 'user-owner',
                    role: 'owner',
                },
                {
                    program_id: 'prog-1',
                    user_id: 'user-admin',
                    role: 'admin',
                },
            ]),
        };
    },
}));

import { useCurrentProgramMembershipRole } from '../../composables/useCurrentProgramMembershipRole';

describe('useCurrentProgramMembershipRole', () => {
    beforeEach(() => {
        mockCollectionRef.value = { table: 'program_user' };
        mockCurrentUserIdRef.value = 'user-owner';
    });

    it('returns the current user role instead of the first program row', () => {
        const { role, isOwner } = useCurrentProgramMembershipRole(ref('prog-1'));

        expect(role.value).toBe('owner');
        expect(isOwner.value).toBe(true);
    });

    it('returns admin when the current user is an admin', () => {
        mockCurrentUserIdRef.value = 'user-admin';

        const { role, isOwner } = useCurrentProgramMembershipRole(ref('prog-1'));

        expect(role.value).toBe('admin');
        expect(isOwner.value).toBe(false);
    });

    it('query factory returns undefined when program id is empty', () => {
        useCurrentProgramMembershipRole(ref('   '));
        const from = vi.fn();
        const result = lastQueryFn({ from } as never);
        expect(result).toBeUndefined();
        expect(from).not.toHaveBeenCalled();
    });
});
