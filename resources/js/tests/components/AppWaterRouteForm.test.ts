import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { configure } from 'vee-validate';
import { Quasar } from 'quasar';
import lang from 'quasar/lang/en-US';

const { notifyError } = vi.hoisted(() => ({
    notifyError: vi.fn(),
}));

const tMap = vi.hoisted(
    () =>
        ({
            'boatsList.nameRequired': 'Name is required',
            'waterRoutesList.name': 'Name',
            'waterRoutesList.duration': 'Duration',
            'waterRoutesList.durationHint': '',
            'waterRoutesList.traceOptional': 'Trace',
            'waterRoutesList.traceHint': '',
            'waterRoutesList.traceUndo': 'Undo',
            'waterRoutesList.traceClear': 'Clear',
            'waterRoutesList.create': 'Create',
            'waterRoutesList.errorGeneric': 'Error',
            'waterRoutesList.invalidGeoJson': 'Bad GeoJSON',
            'common.dismiss': 'Dismiss',
        }) as Record<string, string>,
);

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string) => tMap[key] ?? key,
    }),
}));

const mockCollectionRef = ref<{
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
} | null>(null);

vi.mock('../../powersync/app-powersync.runtime', () => ({
    getAppPowerSyncContext: () => ({
        collections: {
            water_routes: mockCollectionRef,
        },
        refreshOutboxSnapshot: vi.fn(),
    }),
}));

vi.mock('@tanstack/vue-db', () => ({
    useLiveQuery: vi.fn(() => ({ data: ref([]) })),
}));

vi.mock('../../composables/useNotifyErrorFromCatch', () => ({
    useNotifyErrorFromCatch: () => ({ notifyError }),
}));

vi.mock('ulid', () => ({
    ulid: () => 'test-water-route-ulid',
}));

import AppWaterRouteForm from '../../components/molecules/AppWaterRouteForm.vue';
import AppPolylineTraceField from '../../components/molecules/AppPolylineTraceField.vue';

const DEFAULT_TRACE =
    '{"type":"LineString","coordinates":[[-73.5673,45.5017],[-73.5540,45.5080]]}';

describe('AppWaterRouteForm', () => {
    let wrapper: VueWrapper<InstanceType<typeof AppWaterRouteForm>> | null = null;
    let attachEl: HTMLElement | null = null;

    function resetVeeValidateConfig(): void {
        configure({
            validateOnBlur: true,
            validateOnChange: false,
            validateOnInput: false,
            validateOnModelUpdate: true,
        });
    }

    afterEach(() => {
        if (wrapper) {
            const qForm = wrapper.findComponent({ name: 'QForm' });
            if (qForm.exists()) {
                (qForm.vm as { resetValidation?: () => void }).resetValidation?.();
            }
            wrapper.unmount();
        }
        wrapper = null;
        attachEl?.remove();
        attachEl = null;
    });

    beforeEach(() => {
        resetVeeValidateConfig();
        vi.clearAllMocks();
        mockCollectionRef.value = {
            insert: vi.fn().mockReturnValue({
                isPersisted: { promise: Promise.resolve() },
            }),
            update: vi.fn(),
        };
    });

    function mountForm(props: { programId: string; waterRouteId: string | null }) {
        attachEl = document.createElement('div');
        document.body.appendChild(attachEl);
        wrapper = mount(AppWaterRouteForm, {
            props,
            attachTo: attachEl,
            global: {
                plugins: [[Quasar, { lang }]],
            },
        });
        return wrapper;
    }

    async function submitViaQForm(): Promise<void> {
        const qForm = wrapper!.findComponent({ name: 'QForm' });
        const vm = qForm.vm as { submit?: (evt?: Event) => void };
        const evt = new Event('submit', { cancelable: true, bubbles: true });
        await vm.submit?.(evt);
        await flushPromises();
    }

    it('persists default trace when map trace is empty', async () => {
        mountForm({ programId: 'p1', waterRouteId: null });
        await flushPromises();
        const nameInput = wrapper!.find('input[type="text"]');
        await nameInput.setValue('Harbour loop');
        await flushPromises();
        await submitViaQForm();
        expect(mockCollectionRef.value?.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'test-water-route-ulid',
                program_id: 'p1',
                name: 'Harbour loop',
                trace: DEFAULT_TRACE,
                duration_minutes: 60,
            }),
        );
        expect(wrapper!.emitted('success')?.[0]).toEqual([
            { id: 'test-water-route-ulid', mode: 'create' },
        ]);
        expect(notifyError).not.toHaveBeenCalled();
    });

    it('persists traced LineString from the polyline field', async () => {
        mountForm({ programId: 'p1', waterRouteId: null });
        await flushPromises();
        const nameInput = wrapper!.find('input[type="text"]');
        await nameInput.setValue('River run');
        const traceField = wrapper!.findComponent(AppPolylineTraceField);
        await traceField.vm.$emit(
            'update:modelValue',
            '{"type":"LineString","coordinates":[[1,2],[3,4]]}',
        );
        await flushPromises();
        await submitViaQForm();
        expect(mockCollectionRef.value?.insert).toHaveBeenCalledWith(
            expect.objectContaining({
                trace: '{"type":"LineString","coordinates":[[1,2],[3,4]]}',
            }),
        );
    });
});
