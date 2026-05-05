import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

const mockCollectionRef = ref<unknown>({ table: 'water_routes' });

let lastQueryFn: (queryBuilder: {
    from: (arg: unknown) => { where: (fn: (row: unknown) => unknown) => unknown };
}) => unknown;

vi.mock('../../powersync/app-powersync.runtime', () => ({
    getAppPowerSyncContext: () => ({
        collections: {
            water_routes: mockCollectionRef,
        },
    }),
}));

vi.mock('@tanstack/vue-db', () => ({
    useLiveQuery: (
        fn: typeof lastQueryFn,
    ): { data: ReturnType<typeof ref<unknown[]>> } => {
        lastQueryFn = fn;
        return { data: ref([]) };
    },
}));

import { useProgramWaterRoutes } from '../../composables/useProgramWaterRoutes';

describe('useProgramWaterRoutes', () => {
    beforeEach(() => {
        mockCollectionRef.value = { table: 'water_routes' };
    });

    it('returns live query data ref', () => {
        const { data } = useProgramWaterRoutes(ref('prog-1'));
        expect(data.value).toEqual([]);
    });

    it('query factory returns undefined when program id is empty', () => {
        useProgramWaterRoutes(ref(''));
        const from = vi.fn();
        const result = lastQueryFn({ from } as never);
        expect(result).toBeUndefined();
        expect(from).not.toHaveBeenCalled();
    });

    it('query factory returns undefined when collection is null', () => {
        useProgramWaterRoutes(ref('prog-1'));
        mockCollectionRef.value = null;
        const from = vi.fn();
        const result = lastQueryFn({ from } as never);
        expect(result).toBeUndefined();
        expect(from).not.toHaveBeenCalled();
    });

    it('query factory chains from and where when collection and id are set', () => {
        useProgramWaterRoutes(ref('prog-1'));
        mockCollectionRef.value = { table: 'water_routes' };
        const whereResult = { ok: true };
        const where = vi.fn(() => whereResult);
        const from = vi.fn(() => ({ where }));
        const result = lastQueryFn({ from } as never);
        expect(from).toHaveBeenCalledWith({ wr: mockCollectionRef.value });
        expect(where).toHaveBeenCalled();
        expect(result).toBe(whereResult);
    });
});
