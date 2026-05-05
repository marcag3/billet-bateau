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
            'boatTypesList.name': 'Name',
            'boatTypesList.create': 'Create',
            'boatTypesList.save': 'Save',
            'boatTypesList.images': 'Images',
            'boatTypesList.imagesCreateHint': '',
            'boatTypesList.imagesEditHint': '',
            'boatTypesList.existingImages': 'Existing',
            'boatTypesList.removeImage': 'Remove',
            'boatTypesList.errorGeneric': 'Generic error',
            'boatTypesList.imagesUploadFailed': 'Images upload failed',
            'common.dismiss': 'Dismiss',
        }) as Record<string, string>,
);

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string) => tMap[key] ?? key,
    }),
}));

const normalizeImageFilesMock = vi.hoisted(() =>
    vi.fn((value: File | File[] | null | undefined) => {
        void value;
        return [] as File[];
    }),
);

const mockCollectionRef = ref<{
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
} | null>(null);

vi.mock('../../powersync/app-powersync.runtime', () => ({
    getBoatTypesCollection: () => mockCollectionRef,
    refreshOutboxSnapshot: vi.fn(),
}));

vi.mock('../../composables/useNotifyErrorFromCatch', () => ({
    useNotifyErrorFromCatch: () => ({ notifyError }),
}));

vi.mock('../../services/http.client', () => ({
    requestJson: vi.fn(),
    requestFormData: vi.fn(),
}));

vi.mock('../../utilities/image-files', () => ({
    normalizeImageFiles: (value: File | File[] | null | undefined) =>
        normalizeImageFilesMock(value),
}));

vi.mock('ulid', () => ({
    ulid: () => 'test-ulid-new',
}));

import { requestFormData, requestJson } from '../../services/http.client';
import AppBoatTypeForm from '../../components/molecules/AppBoatTypeForm.vue';

describe('AppBoatTypeForm', () => {
    let wrapper: VueWrapper<InstanceType<typeof AppBoatTypeForm>> | null = null;
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
        normalizeImageFilesMock.mockReset();
        normalizeImageFilesMock.mockImplementation(() => []);
        mockCollectionRef.value = {
            insert: vi.fn().mockReturnValue({
                isPersisted: { promise: Promise.resolve() },
            }),
            update: vi.fn(),
        };
        vi.mocked(requestJson).mockReset();
        vi.mocked(requestJson).mockResolvedValue({ data: [] });
        vi.mocked(requestFormData).mockReset();
        vi.mocked(requestFormData).mockResolvedValue(undefined);
    });

    function mountForm(props: {
        programId: string;
        boatTypeId: string | null;
        initialName?: string;
    }) {
        attachEl = document.createElement('div');
        document.body.appendChild(attachEl);
        wrapper = mount(AppBoatTypeForm, {
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

    it('emits success after create when insert succeeds', async () => {
        mountForm({ programId: 'p1', boatTypeId: null });
        await flushPromises();
        const textInput = wrapper!.find('input[type="text"]');
        await textInput.setValue('Day cruiser');
        await flushPromises();
        await submitViaQForm();
        expect(mockCollectionRef.value?.insert).toHaveBeenCalledWith({
            id: 'test-ulid-new',
            program_id: 'p1',
            name: 'Day cruiser',
        });
        expect(wrapper!.emitted('success')?.[0]).toEqual([
            { id: 'test-ulid-new', mode: 'create' },
        ]);
        expect(notifyError).not.toHaveBeenCalled();
    });

    it('does not persist create when name is empty', async () => {
        mountForm({ programId: 'p1', boatTypeId: null });
        await flushPromises();
        await submitViaQForm();
        expect(mockCollectionRef.value?.insert).not.toHaveBeenCalled();
    });
});
