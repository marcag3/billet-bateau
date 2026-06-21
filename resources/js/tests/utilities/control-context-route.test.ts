import { describe, expect, it, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { controlContextNamedRoute } from '../../utilities/control-context-route';
import { useControlContextStore } from '../../store/control-context.store';

function mockRoute(programId = 'prog-1') {
    return {
        params: { programId },
        query: {},
    } as never;
}

describe('controlContextNamedRoute', () => {
    it('builds named route with program id', () => {
        const route = mockRoute('prog-1');
        expect(controlContextNamedRoute(route, 'control.voyages.list')).toEqual({
            name: 'control.voyages.list',
            params: { programId: 'prog-1' },
        });
    });

    it('merges extra params', () => {
        const route = mockRoute('prog-1');
        expect(
            controlContextNamedRoute(route, 'control.voyages.edit', { voyageId: 'v-1' }),
        ).toEqual({
            name: 'control.voyages.edit',
            params: { programId: 'prog-1', voyageId: 'v-1' },
        });
    });
});

describe('useControlContextStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('keeps date state per program', () => {
        const store = useControlContextStore();

        store.setSelectedDateYmd('prog-a', '2026-06-20');
        store.setSelectedDateYmd('prog-b', '2026-07-01');

        expect(store.getProgramState('prog-a').selectedDateYmd).toBe('2026-06-20');
        expect(store.getProgramState('prog-b').selectedDateYmd).toBe('2026-07-01');
    });

    it('hydrates from route date only on first access', () => {
        const store = useControlContextStore();

        store.ensureProgram('prog-1', '2026-06-15');
        store.setSelectedDateYmd('prog-1', '2026-06-20');

        store.ensureProgram('prog-1', '2026-06-15');

        expect(store.getProgramState('prog-1').selectedDateYmd).toBe('2026-06-20');
    });

    it('shifts selected day for the active program', () => {
        const store = useControlContextStore();

        store.setSelectedDateYmd('prog-1', '2026-06-20');
        store.shiftSelectedDay('prog-1', 1);

        expect(store.getProgramState('prog-1').selectedDateYmd).toBe('2026-06-21');
        expect(store.getProgramState('prog-1').showAllDates).toBe(false);
    });
});
