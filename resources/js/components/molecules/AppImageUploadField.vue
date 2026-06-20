<template>
    <div class="column gap-1">
        <div v-if="label.length > 0" class="text-caption text-grey-7">
            {{ label }}
        </div>

        <q-card
            flat
            bordered
            class="relative"
            :class="[
                compactPreview ? 'self-start' : 'w-full',
                !hasPreview && 'border-dashed',
                isDragOver && 'bg-blue-1',
                (disabled || isUploading) && 'opacity-70',
            ]"
            :style="cardStyle"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="isDragOver = false"
            @drop.prevent="onDrop"
        >
            <q-card-section
                class="p-0 cursor-pointer"
                :class="(disabled || isUploading) && 'cursor-not-allowed'"
                role="button"
                tabindex="0"
                :aria-label="dropzoneAriaLabel"
                @click="onDropzoneClick"
                @keydown.enter.prevent="onDropzoneKeydown"
                @keydown.space.prevent="onDropzoneKeydown"
            >
                <q-img
                    v-if="hasPreview"
                    :src="displayPreviewUrl"
                    :ratio="previewRatio"
                    :fit="compactPreview ? 'cover' : 'contain'"
                    :class="!compactPreview && 'w-full'"
                    :style="compactPreview ? undefined : previewStyle"
                />

                <div
                    v-else
                    class="column items-center justify-center p-4 text-center"
                    :class="!compactPreview && 'w-full'"
                    :style="emptyStateStyle"
                >
                    <q-icon name="image" size="md" color="grey-6" />
                    <div class="text-body2 mt-2">{{ t('imageUploadField.emptyHint') }}</div>
                    <div v-if="hint.length > 0" class="text-caption text-grey-7 mt-1">
                        {{ hint }}
                    </div>
                </div>
            </q-card-section>

            <q-card-section v-if="showActions" class="pt-2 pb-2" @click.stop>
                <div class="row gap-2">
                    <q-btn
                        flat
                        dense
                        no-caps
                        color="primary"
                        :label="t('imageUploadField.replace')"
                        :disable="disabled || isUploading"
                        @click="openFilePicker"
                    />
                    <q-btn
                        v-if="showRemoveAction"
                        flat
                        dense
                        no-caps
                        color="negative"
                        :label="removeActionLabel"
                        :loading="clearExistingLoading"
                        :disable="disabled || isUploading || clearExistingLoading"
                        @click="onRemove"
                    />
                </div>
            </q-card-section>
        </q-card>

        <div v-if="fieldError.length > 0" class="text-negative text-caption" role="alert">
            {{ fieldError }}
        </div>

        <q-file
            ref="fileInputRef"
            v-model="fileModel"
            class="hidden"
            :accept="accept"
            :max-files="1"
            :disable="disabled || isUploading"
            @update:model-value="onFileModelUpdated"
        />

        <AppImageCropDialog
            v-if="croppable"
            v-model="cropDialogOpen"
            :image-file="cropSourceFile"
            :aspect-ratio="previewRatio"
            :file-name="cropSourceFileName"
            :mime-type="cropSourceMimeType"
            @apply="onCropApplied"
            @cancel="onCropCancelled"
            @hidden="onCropDialogHidden"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { QFile } from 'quasar';
import { fileMatchesAccept } from '../../utilities/image-accept';
import { normalizeImageFiles } from '../../utilities/image-files';
import type { ImageDirectUploadResult } from '../../utilities/image-uploader';
import { uploadImageViaPresignedPut } from '../../utilities/image-uploader';
import AppImageCropDialog from './AppImageCropDialog.vue';

const props = withDefaults(
    defineProps<{
        label: string;
        hint?: string;
        accept?: string;
        disabled?: boolean;
        existingImageUrl?: string;
        presignUrl?: string;
        clearable?: boolean;
        previewMaxWidthPx?: number;
        previewMaxHeightPx?: number;
        previewRatio?: number;
        allowClearExisting?: boolean;
        clearExistingLoading?: boolean;
        clearExistingAriaLabel?: string;
        croppable?: boolean;
    }>(),
    {
        hint: '',
        accept: 'image/jpeg,image/png,image/webp',
        disabled: false,
        existingImageUrl: '',
        presignUrl: '',
        clearable: true,
        previewMaxWidthPx: 0,
        previewMaxHeightPx: 240,
        previewRatio: 16 / 9,
        allowClearExisting: false,
        clearExistingLoading: false,
        clearExistingAriaLabel: '',
        croppable: true,
    },
);

const emit = defineEmits<{
    uploaded: [payload: ImageDirectUploadResult];
    error: [message: string];
    cleared: [];
    'clear-existing': [];
}>();

const { t } = useI18n();

const fileInputRef = useTemplateRef<InstanceType<typeof QFile>>('fileInputRef');
const fileModel = ref<File | File[] | null>(null);
const pendingUploadFile = ref<File | null>(null);
const pendingPreviewUrl = ref<string | null>(null);
const isUploading = ref(false);
const isDragOver = ref(false);
const fieldError = ref('');
const cropDialogOpen = ref(false);
const cropSourceFile = ref<File | null>(null);
const cropSourceFileName = ref('image.jpg');
const cropSourceMimeType = ref('image/jpeg');

const compactPreview = computed(
    () => typeof props.previewMaxWidthPx === 'number' && props.previewMaxWidthPx > 0,
);

const cardStyle = computed(() => {
    const width = props.previewMaxWidthPx;
    if (typeof width !== 'number' || width <= 0) {
        return undefined;
    }

    const widthPx = `${String(width)}px`;
    return {
        maxWidth: widthPx,
        width: widthPx,
    };
});

const previewStyle = computed(() => ({
    height: `${String(props.previewMaxHeightPx)}px`,
}));

const emptyStateStyle = computed(() => {
    if (compactPreview.value) {
        const size = `${String(props.previewMaxWidthPx)}px`;
        return { width: size, minHeight: size };
    }

    return {
        height: `${String(props.previewMaxHeightPx)}px`,
    };
});

const hasPendingSelection = computed(() => pendingUploadFile.value != null);

const displayPreviewUrl = computed(() => {
    if (pendingPreviewUrl.value != null && pendingPreviewUrl.value.length > 0) {
        return pendingPreviewUrl.value;
    }

    return props.existingImageUrl;
});

const hasPreview = computed(() => displayPreviewUrl.value.length > 0);

const dropzoneAriaLabel = computed(() => {
    if (props.label.length > 0) {
        return props.label;
    }

    return t('imageUploadField.emptyHint');
});

const showActions = computed(
    () => hasPreview.value || hasPendingSelection.value || props.existingImageUrl.length > 0,
);

const showRemoveAction = computed(() => {
    if (hasPendingSelection.value) {
        return props.clearable;
    }

    return props.allowClearExisting && props.existingImageUrl.length > 0;
});

const removeActionLabel = computed(() => {
    if (hasPendingSelection.value) {
        return t('imageUploadField.clear');
    }

    if (props.clearExistingAriaLabel.length > 0) {
        return props.clearExistingAriaLabel;
    }

    return t('imageUploadField.remove');
});

function setFieldError(message: string): void {
    fieldError.value = message;
    emit('error', message);
}

function clearFieldError(): void {
    fieldError.value = '';
}

function revokePendingPreview(): void {
    if (pendingPreviewUrl.value != null) {
        URL.revokeObjectURL(pendingPreviewUrl.value);
        pendingPreviewUrl.value = null;
    }
}

function closeCropDialog(): void {
    cropDialogOpen.value = false;
}

function onCropDialogHidden(): void {
    cropSourceFile.value = null;
}

function clearPendingSelection(): void {
    pendingUploadFile.value = null;
    revokePendingPreview();
}

function setPendingFile(file: File): void {
    clearPendingSelection();
    pendingUploadFile.value = file;
    pendingPreviewUrl.value = URL.createObjectURL(file);
}

function openFilePicker(): void {
    if (props.disabled || isUploading.value) {
        return;
    }

    fileInputRef.value?.pickFiles();
}

function onDropzoneClick(): void {
    if (props.disabled || isUploading.value) {
        return;
    }

    openFilePicker();
}

function onDropzoneKeydown(): void {
    onDropzoneClick();
}

function onDragOver(): void {
    if (props.disabled || isUploading.value) {
        return;
    }

    isDragOver.value = true;
}

function ingestFile(file: File): void {
    if (!fileMatchesAccept(file, props.accept)) {
        setFieldError(t('imageUploadField.invalidType'));
        return;
    }

    clearFieldError();
    fileModel.value = null;

    if (!props.croppable) {
        setPendingFile(file);
        return;
    }

    cropSourceFileName.value = file.name;
    cropSourceMimeType.value = file.type.length > 0 ? file.type : 'image/jpeg';
    cropSourceFile.value = file;
    cropDialogOpen.value = true;
}

function onCropApplied(file: File): void {
    setPendingFile(file);
}

function onCropCancelled(): void {
    fileModel.value = null;
}

function onFileModelUpdated(value: File | File[] | null): void {
    const files = normalizeImageFiles(value);
    const file = files[0];
    if (!(file instanceof File)) {
        return;
    }

    ingestFile(file);
}

function onDrop(event: DragEvent): void {
    isDragOver.value = false;

    if (props.disabled || isUploading.value) {
        return;
    }

    const file = event.dataTransfer?.files.item(0);
    if (!(file instanceof File)) {
        return;
    }

    ingestFile(file);
}

function onRemove(): void {
    if (hasPendingSelection.value) {
        clearPendingSelection();
        fileModel.value = null;
        clearFieldError();
        emit('cleared');
        return;
    }

    emit('clear-existing');
}

async function runUpload(presignUrl: string): Promise<ImageDirectUploadResult | null> {
    if (presignUrl.length === 0) {
        return null;
    }

    const file = pendingUploadFile.value;
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
        clearPendingSelection();
        fileModel.value = null;
        clearFieldError();
        return result;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setFieldError(message);
        throw error;
    } finally {
        isUploading.value = false;
    }
}

async function uploadIfNeeded(override?: {
    presignUrl: string;
}): Promise<ImageDirectUploadResult | null> {
    const presign = override?.presignUrl ?? props.presignUrl;
    return runUpload(presign);
}

function clearSelection(): void {
    clearPendingSelection();
    fileModel.value = null;
    clearFieldError();
}

onBeforeUnmount(() => {
    closeCropDialog();
    cropSourceFile.value = null;
    clearPendingSelection();
});

defineExpose({
    uploadIfNeeded,
    clearSelection,
});
</script>
