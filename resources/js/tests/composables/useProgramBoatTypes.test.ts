import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

const mockCollectionRef = ref<unknown>({ table: 'boat_types' });

let lastQueryFn: (queryBuilder: {
    from: (arg: unknown) => { where: (fn: (row: unknown) => unknown) => unknown };
}) => unknown;

vi.mock('../../powersync/app-powersync.runtime', () => ({
    getBoatTypesCollection: () => mockCollectionRef,
}));

vi.mock('@tanstack/vue-db', () => ({
    useLiveQuery: (
        fn: typeof lastQueryFn,
    ): { data: ReturnType<typeof ref<unknown[]>> } => {
        lastQueryFn = fn;
        return { data: ref([]) };
    },
}));

import { useProgramBoatTypes } from '../../composables/useProgramBoatTypes';

describe('useProgramBoatTypes', () => {
    beforeEach(() => {
        mockCollectionRef.value = { table: 'boat_types' };
    });

    it('returns live query data ref', () => {
        const { data } = useProgramBoatTypes(ref('prog-1'));
        expect(data.value).toEqual([]);
    });

    it('query factory returns undefined when program id is empty', () => {
        useProgramBoatTypes(ref('   '));
        const from = vi.fn();
        const result = lastQueryFn({ from } as never);
        expect(result).toBeUndefined();
        expect(from).not.toHaveBeenCalled();
    });

    it('query factory returns undefined when collection is null', () => {
        useProgramBoatTypes(ref('prog-1'));
        mockCollectionRef.value = null;
        const from = vi.fn();
        const result = lastQueryFn({ from } as never);
        expect(result).toBeUndefined();
        expect(from).not.toHaveBeenCalled();
    });

    it('query factory chains from and where when collection and id are set', () => {
        useProgramBoatTypes(ref('prog-1'));
        mockCollectionRef.value = { table: 'boat_types' };
        const whereResult = { ok: true };
        const where = vi.fn(() => whereResult);
        const fromReturn = { where };
        const from = vi.fn(() => fromReturn);
        const result = lastQueryFn({ from } as never);
        expect(from).toHaveBeenCalledWith({ bt: mockCollectionRef.value });
        expect(where).toHaveBeenCalled();
        expect(result).toBe(whereResult);
    });
});
