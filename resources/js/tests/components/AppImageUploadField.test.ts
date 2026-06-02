import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { Quasar } from 'quasar';
import lang from 'quasar/lang/en-US';
import AppImageUploadField from '../../components/molecules/AppImageUploadField.vue';
import { uploadImageViaPresignedPut } from '../../utilities/image-uploader';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('../../utilities/image-uploader', () => ({
    uploadImageViaPresignedPut: vi.fn(),
}));

describe('AppImageUploadField', () => {
    let wrapper: VueWrapper<InstanceType<typeof AppImageUploadField>> | null = null;
    const createObjectUrl = vi.fn(() => 'blob:test-preview');
    const revokeObjectUrl = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal(
            'URL',
            Object.assign(URL, {
                createObjectURL: createObjectUrl,
                revokeObjectURL: revokeObjectUrl,
            }),
        );
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
            wrapper = null;
        }
        vi.unstubAllGlobals();
    });

    function mountField(
        extraProps: Record<string, unknown> = {},
    ): VueWrapper<InstanceType<typeof AppImageUploadField>> {
        wrapper = mount(AppImageUploadField, {
            props: {
                label: 'Upload',
                presignUrl: '/api/presign',
                ...extraProps,
            },
            global: {
                plugins: [[Quasar, { lang }]],
            },
        });
        return wrapper;
    }

    it('uploads the selected file as-is when explicitly requested', async () => {
        const mounted = mountField();
        const selectedFile = new File(['binary'], 'photo.jpg', { type: 'image/jpeg' });
        const uploadResult = {
            publicUrl: 'https://cdn.test/banner.jpg',
            objectKey: 'programs/banner.jpg',
            mimeType: 'image/jpeg',
            sizeBytes: selectedFile.size,
            etag: 'etag-1',
        };

        vi.mocked(uploadImageViaPresignedPut).mockResolvedValue(uploadResult);

        const qFile = mounted.findComponent({ name: 'QFile' });
        qFile.vm.$emit('update:modelValue', selectedFile);
        await flushPromises();

        expect(createObjectUrl).toHaveBeenCalledWith(selectedFile);
        expect(uploadImageViaPresignedPut).not.toHaveBeenCalled();

        const result = await mounted.vm.uploadIfNeeded();

        expect(uploadImageViaPresignedPut).toHaveBeenCalledTimes(1);
        expect(uploadImageViaPresignedPut).toHaveBeenCalledWith(selectedFile, '/api/presign');
        expect(result).toEqual(uploadResult);
        expect(mounted.emitted('uploaded')?.[0]).toEqual([uploadResult]);
    });

    it('emits cleared when pending selection is removed', async () => {
        const mounted = mountField();
        const selectedFile = new File(['binary'], 'photo.jpg', { type: 'image/jpeg' });

        const qFile = mounted.findComponent({ name: 'QFile' });
        qFile.vm.$emit('update:modelValue', selectedFile);
        await flushPromises();

        const removeButton = mounted
            .findAllComponents({ name: 'QBtn' })
            .find((button) => button.text() === 'imageUploadField.clear');

        expect(removeButton).toBeTruthy();
        await removeButton!.trigger('click');

        expect(mounted.emitted('cleared')).toBeTruthy();
    });

    it('shows an inline error for invalid file types', async () => {
        const mounted = mountField();
        const invalidFile = new File(['binary'], 'notes.txt', { type: 'text/plain' });

        const qFile = mounted.findComponent({ name: 'QFile' });
        qFile.vm.$emit('update:modelValue', invalidFile);
        await flushPromises();

        expect(mounted.text()).toContain('imageUploadField.invalidType');
        expect(mounted.emitted('error')?.[0]).toEqual(['imageUploadField.invalidType']);
        expect(uploadImageViaPresignedPut).not.toHaveBeenCalled();
    });

    it('emits clear-existing when removing an existing remote image', async () => {
        const mounted = mountField({
            existingImageUrl: 'https://cdn.test/existing.webp',
            allowClearExisting: true,
        });

        const removeButton = mounted
            .findAllComponents({ name: 'QBtn' })
            .find((button) => button.text() === 'imageUploadField.remove');

        expect(removeButton).toBeTruthy();
        await removeButton!.trigger('click');

        expect(mounted.emitted('clear-existing')).toBeTruthy();
    });
});
