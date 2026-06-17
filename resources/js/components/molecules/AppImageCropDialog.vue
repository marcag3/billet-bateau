<template>
    <q-dialog v-model="dialogOpen" persistent @show="onDialogShow" @hide="onDialogHide">
        <q-card style="width: min(560px, 94vw); max-width: 100%">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ t('imageUploadField.cropTitle') }}</div>
                <q-space />
                <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    :aria-label="t('common.cancel')"
                    @click="onCancel"
                />
            </q-card-section>

            <q-card-section>
                <div ref="cropContainerRef" class="crop-container rounded-borders bg-grey-9">
                    <img
                        ref="imageRef"
                        :src="imageUrl"
                        alt=""
                        class="crop-source-image"
                    />
                </div>

                <div class="q-mt-md">
                    <div class="text-caption text-grey-7 q-mb-xs">
                        {{ t('imageUploadField.cropZoom') }}
                    </div>
                    <q-slider
                        v-model="zoom"
                        :min="1"
                        :max="3"
                        :step="0.01"
                        color="primary"
                        label
                        :disable="!isReady"
                        @update:model-value="onZoomUpdated"
                    />
                </div>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat no-caps :label="t('common.cancel')" @click="onCancel" />
                <q-btn
                    color="primary"
                    no-caps
                    :label="t('imageUploadField.cropApply')"
                    :loading="isApplying"
                    :disable="!isReady || isApplying"
                    @click="onApply"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { exportCroppedFileFromCropper } from '../../utilities/image-crop';

const VIEWPORT_HEIGHT_PX = 320;

const props = defineProps<{
    imageUrl: string;
    aspectRatio: number;
    fileName: string;
    mimeType: string;
}>();

const dialogOpen = defineModel<boolean>({ required: true });

const emit = defineEmits<{
    apply: [file: File];
    cancel: [];
}>();

const { t } = useI18n();

const cropContainerRef = useTemplateRef<HTMLElement>('cropContainerRef');
const imageRef = useTemplateRef<HTMLImageElement>('imageRef');
const isReady = ref(false);
const isApplying = ref(false);
const zoom = ref(1);

let cropper: Cropper | null = null;
let baseZoomRatio = 1;

function destroyCropper(): void {
    cropper?.destroy();
    cropper = null;
    baseZoomRatio = 1;
    zoom.value = 1;
    isReady.value = false;
}

function initCropper(): void {
    const image = imageRef.value;
    if (image == null) {
        return;
    }

    destroyCropper();

    cropper = new Cropper(image, {
        aspectRatio: props.aspectRatio > 0 ? props.aspectRatio : Number.NaN,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        responsive: true,
        restore: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: false,
        cropBoxResizable: false,
        toggleDragModeOnDblclick: false,
        zoomOnWheel: true,
        ready() {
            const imageData = cropper?.getImageData();
            if (imageData != null && imageData.naturalWidth > 0) {
                baseZoomRatio = imageData.width / imageData.naturalWidth;
            }

            isReady.value = true;
        },
    });
}

async function prepareCropSurface(): Promise<void> {
    destroyCropper();

    await nextTick();

    const image = imageRef.value;
    if (image == null) {
        throw new Error('Unable to initialize crop surface.');
    }

    if (image.complete && image.naturalWidth > 0) {
        initCropper();
        return;
    }

    await new Promise<void>((resolve, reject) => {
        image.onload = () => {
            resolve();
        };
        image.onerror = () => {
            reject(new Error('Unable to load image for cropping.'));
        };
    });

    initCropper();
}

function onZoomUpdated(value: number | null): void {
    if (cropper == null || value == null || !isReady.value) {
        return;
    }

    cropper.zoomTo(baseZoomRatio * value);
}

function onCancel(): void {
    dialogOpen.value = false;
    emit('cancel');
}

function onDialogHide(): void {
    destroyCropper();
}

async function onDialogShow(): Promise<void> {
    try {
        await prepareCropSurface();
    } catch {
        dialogOpen.value = false;
        emit('cancel');
    }
}

async function onApply(): Promise<void> {
    if (!isReady.value || isApplying.value || cropper == null) {
        return;
    }

    isApplying.value = true;

    try {
        const croppedFile = await exportCroppedFileFromCropper(cropper, {
            fileName: props.fileName,
            mimeType: props.mimeType,
        });

        dialogOpen.value = false;
        emit('apply', croppedFile);
    } finally {
        isApplying.value = false;
    }
}

watch(
    () => props.imageUrl,
    async () => {
        if (!dialogOpen.value) {
            return;
        }

        try {
            await prepareCropSurface();
        } catch {
            dialogOpen.value = false;
            emit('cancel');
        }
    },
);

watch(
    () => dialogOpen.value,
    (isOpen) => {
        if (!isOpen) {
            destroyCropper();
        }
    },
);

onBeforeUnmount(() => {
    destroyCropper();
});
</script>

<style scoped>
.crop-container {
    width: 100%;
    height: v-bind('`${VIEWPORT_HEIGHT_PX}px`');
    overflow: hidden;
}

.crop-source-image {
    display: block;
    max-width: 100%;
}
</style>
