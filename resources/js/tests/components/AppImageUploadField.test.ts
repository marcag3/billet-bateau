import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { Quasar } from 'quasar';
import lang from 'quasar/lang/en-US';
import AppImageUploadField from '../../components/molecules/AppImageUploadField.vue';
import { uploadImageViaPresignedPut } from '../../utilities/image-uploader';

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
    });

    function mountField(): VueWrapper<InstanceType<typeof AppImageUploadField>> {
        wrapper = mount(AppImageUploadField, {
            props: {
                label: 'Upload',
                presignUrl: '/api/presign',
            },
            global: {
                plugins: [[Quasar, { lang }]],
            },
        });
        return wrapper;
    }

    it('does not upload on selection and uploads when explicitly requested', async () => {
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

        expect(uploadImageViaPresignedPut).not.toHaveBeenCalled();

        const result = await mounted.vm.uploadIfNeeded();

        expect(uploadImageViaPresignedPut).toHaveBeenCalledTimes(1);
        expect(uploadImageViaPresignedPut).toHaveBeenCalledWith(selectedFile, '/api/presign');
        expect(result).toEqual(uploadResult);
        expect(mounted.emitted('uploaded')?.[0]).toEqual([uploadResult]);
    });

    it('emits cleared when q-file clear event fires', async () => {
        const mounted = mountField();

        const qFile = mounted.findComponent({ name: 'QFile' });
        qFile.vm.$emit('clear');
        await flushPromises();

        expect(mounted.emitted('cleared')).toBeTruthy();
    });
});
