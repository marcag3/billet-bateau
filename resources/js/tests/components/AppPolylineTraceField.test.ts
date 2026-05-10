import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { Quasar } from 'quasar';
import lang from 'quasar/lang/en-US';
import {
    resetLeafletTestHarness,
    simulateLeafletMapClick,
} from '../../tests/mocks/leaflet';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string) =>
            ({
                'waterRoutesList.traceUndo': 'Undo',
                'waterRoutesList.traceClear': 'Clear',
            })[key] ?? key,
    }),
}));

import AppPolylineTraceField from '../../components/molecules/AppPolylineTraceField.vue';

describe('AppPolylineTraceField', () => {
    let wrapper: VueWrapper<InstanceType<typeof AppPolylineTraceField>> | null = null;
    let attachEl: HTMLElement | null = null;

    afterEach(() => {
        wrapper?.unmount();
        wrapper = null;
        attachEl?.remove();
        attachEl = null;
        resetLeafletTestHarness();
    });

    beforeEach(() => {
        resetLeafletTestHarness();
    });

    function mountField(props?: {
        modelValue?: string;
        disable?: boolean;
    }) {
        attachEl = document.createElement('div');
        document.body.appendChild(attachEl);
        wrapper = mount(AppPolylineTraceField, {
            props: {
                modelValue: '',
                label: 'Trace',
                hint: 'Hint',
                ...props,
            },
            attachTo: attachEl,
            global: {
                plugins: [[Quasar, { lang }]],
            },
        });
        return wrapper;
    }

    it('emits a LineString after two map clicks', async () => {
        mountField();
        await flushPromises();
        simulateLeafletMapClick(-73.5, 45.5);
        simulateLeafletMapClick(-73.4, 45.6);
        await flushPromises();
        const emitted = wrapper!.emitted('update:modelValue') ?? [];
        expect(emitted.length).toBeGreaterThanOrEqual(2);
        const last = emitted[emitted.length - 1]?.[0] as string;
        expect(JSON.parse(last)).toEqual({
            type: 'LineString',
            coordinates: [
                [-73.5, 45.5],
                [-73.4, 45.6],
            ],
        });
    });

    it('undo removes the last emitted coordinate', async () => {
        mountField();
        await flushPromises();
        simulateLeafletMapClick(-1, 2);
        simulateLeafletMapClick(-3, 4);
        simulateLeafletMapClick(-5, 6);
        await flushPromises();
        await wrapper!.find('[data-testid="polyline-trace-undo"]').trigger('click');
        await flushPromises();
        const emitted = wrapper!.emitted('update:modelValue') ?? [];
        const last = emitted[emitted.length - 1]?.[0] as string;
        expect(JSON.parse(last)).toEqual({
            type: 'LineString',
            coordinates: [
                [-1, 2],
                [-3, 4],
            ],
        });
    });

    it('clear resets the trace', async () => {
        mountField();
        await flushPromises();
        simulateLeafletMapClick(-10, 20);
        simulateLeafletMapClick(-11, 21);
        await flushPromises();
        await wrapper!.find('[data-testid="polyline-trace-clear"]').trigger('click');
        await flushPromises();
        const emitted = wrapper!.emitted('update:modelValue') ?? [];
        const last = emitted[emitted.length - 1]?.[0] as string;
        expect(last).toBe('');
    });
});
