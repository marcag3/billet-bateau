<template>
    <div class="app-image-upload-field q-gutter-y-sm">
        <div v-if="showExistingRemotePreview" class="row q-col-gutter-sm items-start">
            <div class="col-auto">
                <q-card flat bordered class="relative-position app-image-upload-field__thumb" :style="thumbCardStyle">
                    <q-img :src="existingImageUrl" :ratio="previewRatio" fit="cover"
                        class="app-image-upload-field__thumb-img" />
                    <q-btn v-if="allowClearExisting" flat round dense icon="close" color="negative" size="sm"
                        class="absolute-top-right q-ma-xs" :loading="clearExistingLoading"
                        :disable="disabled || isUploading || clearExistingLoading" :aria-label="clearExistingAriaLabel"
                        @click="emit('clear-existing')" />
                    <q-card-section v-if="existingImageCaption.length > 0" class="text-caption text-grey-7">
                        {{ existingImageCaption }}
                    </q-card-section>
                </q-card>
            </div>
        </div>

        <q-file v-model="fileModel" outlined :dense="dense" :clearable="clearable" :label="label" :hint="hint"
            :accept="accept" :disable="disabled || isUploading" :loading="isUploading" @clear="onFileClear" />

        <q-card v-if="localPreviewUrl.length > 0" flat bordered class="app-image-upload-field__preview-card"
            :style="thumbCardStyle">
            <q-img :src="localPreviewUrl" :ratio="previewRatio" fit="cover" />
            <q-card-section v-if="previewCaption.length > 0" class="text-caption text-grey-7">
                {{ previewCaption }}
            </q-card-section>
        </q-card>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import type { ImageDirectUploadResult } from '../../utilities/image-uploader';
import { uploadImageViaPresignedPut } from '../../utilities/image-uploader';
import { normalizeImageFiles } from '../../utilities/image-files';

const props = withDefaults(
    defineProps<{
        label: string;
        hint?: string;
        accept?: string;
        disabled?: boolean;
        dense?: boolean;
        /** Current remote image (shown when no new file is selected). */
        existingImageUrl?: string;
        /** Optional caption under the existing remote preview (e.g. program edit). */
        existingImageCaption?: string;
        presignUrl?: string;
        clearable?: boolean;
        /** Optional preview dimensions for thumbnail-style UIs (e.g. boat type). */
        previewMaxWidthPx?: number;
        /** Passed to `q-img` for crop box aspect. */
        previewRatio?: number;
        previewCaption?: string;
        allowClearExisting?: boolean;
        clearExistingLoading?: boolean;
        clearExistingAriaLabel?: string;
    }>(),
    {
        hint: '',
        accept: 'image/jpeg,image/png,image/webp',
        disabled: false,
        dense: false,
        existingImageUrl: '',
        existingImageCaption: '',
        presignUrl: '',
        clearable: true,
        previewMaxWidthPx: 0,
        previewRatio: 16 / 9,
        previewCaption: '',
        allowClearExisting: false,
        clearExistingLoading: false,
        clearExistingAriaLabel: '',
    },
);

const emit = defineEmits<{
    uploaded: [payload: ImageDirectUploadResult];
    error: [message: string];
    cleared: [];
    'clear-existing': [];
}>();

const fileModel = ref<File | File[] | null>(null);
const isUploading = ref(false);
const localObjectUrl = ref<string | null>(null);

const thumbCardStyle = computed(() => {
    const w = props.previewMaxWidthPx;
    if (typeof w === 'number' && w > 0) {
        return { maxWidth: `${String(w)}px` };
    }
    return {};
});

const localPreviewUrl = computed(() =>
    localObjectUrl.value != null && localObjectUrl.value.length > 0
        ? localObjectUrl.value
        : '',
);

const showExistingRemotePreview = computed(() => {
    if (props.existingImageUrl.length === 0) {
        return false;
    }
    return localObjectUrl.value == null;
});

function revokeLocalPreview(): void {
    if (localObjectUrl.value != null) {
        URL.revokeObjectURL(localObjectUrl.value);
        localObjectUrl.value = null;
    }
}

function syncLocalPreviewFromModel(): void {
    revokeLocalPreview();
    const files = normalizeImageFiles(fileModel.value);
    const first = files[0];
    if (first instanceof File) {
        localObjectUrl.value = URL.createObjectURL(first);
    }
}

watch(fileModel, () => {
    syncLocalPreviewFromModel();
});

onBeforeUnmount(() => {
    revokeLocalPreview();
});

function onFileClear(): void {
    revokeLocalPreview();
    emit('cleared');
}

async function runUpload(presignUrl: string): Promise<ImageDirectUploadResult | null> {
    if (presignUrl.length === 0) {
        return null;
    }

    const files = normalizeImageFiles(fileModel.value);
    const file = files[0];
    if (!(file instanceof File)) {
        return null;
    }

    if (isUploading.value) {
        return null;
    }

    isUploading.value = true;
    try {
        const result = await uploadImageViaPresignedPut(file, presignUrl);
        emit('uploaded', result);
        fileModel.value = null;
        revokeLocalPreview();
        return result;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        emit('error', message);
        throw error;
    } finally {
        isUploading.value = false;
    }
}

/**
 * Uploads the currently selected file on demand.
 * The component does not auto-upload on file selection.
 */
async function uploadIfNeeded(override?: {
    presignUrl: string;
}): Promise<ImageDirectUploadResult | null> {
    const presign = override?.presignUrl ?? props.presignUrl;
    return runUpload(presign);
}

function clearSelection(): void {
    fileModel.value = null;
    revokeLocalPreview();
}

defineExpose({
    uploadIfNeeded,
    clearSelection,
});
</script>

<style scoped>
.app-image-upload-field__thumb {
    width: 100%;
}

.app-image-upload-field__thumb-img {
    width: 100%;
}

.app-image-upload-field__preview-card {
    overflow: hidden;
}
</style>
