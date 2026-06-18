<template>
    <q-dialog v-model="dialogOpen" persistent @show="onDialogShow" @hide="onDialogHide">
        <q-card class="w-[min(920px,96vw)] max-w-full">
            <q-card-section class="row items-center pb-0">
                <div class="text-h6">{{ t('imageUploadField.cropTitle') }}</div>
                <q-space />
                <q-btn
                    flat
                    round
                    dense
                    icon="close"
                    :aria-label="t('common.cancel')"
                    @click="close"
                />
            </q-card-section>

            <q-card-section>
                <div
                    ref="cropContainerRef"
                    class="w-full h-[min(70vh,720px)] min-h-[400px] overflow-hidden [&_cropper-canvas]:h-full rounded-borders bg-grey-9"
                >
                    <img ref="imageRef" :src="localImageUrl" alt="" class="block max-w-full" />
                </div>

                <div class="mt-4">
                    <div class="text-caption text-grey-7 mb-1">
                        {{ t('imageUploadField.cropZoom') }}
                    </div>
                    <q-slider
                        v-model="zoom"
                        :min="minZoomMultiplier"
                        :max="maxZoomMultiplier"
                        :step="0.01"
                        color="primary"
                        label
                        :disable="!isReady"
                        @update:model-value="onZoomUpdated"
                    />
                </div>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat no-caps :label="t('common.cancel')" @click="close" />
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
import { nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useImageCropper } from '../../composables/useImageCropper';
import { exportCroppedFileFromSelection } from '../../utilities/image-crop';

const props = defineProps<{
    imageFile: File | null;
    aspectRatio: number;
    fileName: string;
    mimeType: string;
}>();

const dialogOpen = defineModel<boolean>({ required: true });

const emit = defineEmits<{
    apply: [file: File];
    cancel: [];
    hidden: [];
}>();

const { t } = useI18n();

const cropContainerRef = useTemplateRef<HTMLElement>('cropContainerRef');
const imageRef = useTemplateRef<HTMLImageElement>('imageRef');
const isApplying = ref(false);
const localImageUrl = ref('');

const {
    isReady,
    zoom,
    minZoomMultiplier,
    maxZoomMultiplier,
    mount,
    destroy,
    setZoomMultiplier,
    getSelection,
} = useImageCropper();

function releaseLocalImageUrl(): void {
    if (localImageUrl.value.length === 0) {
        return;
    }

    URL.revokeObjectURL(localImageUrl.value);
    localImageUrl.value = '';
}

async function mountCropper(file: File): Promise<void> {
    releaseLocalImageUrl();
    localImageUrl.value = URL.createObjectURL(file);
    await nextTick();

    const container = cropContainerRef.value;
    const image = imageRef.value;

    if (container == null || image == null) {
        throw new Error('Unable to initialize crop surface.');
    }

    await mount(container, image, props.aspectRatio);
}

function onZoomUpdated(value: number | null): void {
    if (value != null) {
        setZoomMultiplier(value);
    }
}

function close(): void {
    dialogOpen.value = false;
    emit('cancel');
}

function onDialogHide(): void {
    destroy();
    releaseLocalImageUrl();
    emit('hidden');
}

async function onDialogShow(): Promise<void> {
    const file = props.imageFile;
    if (!(file instanceof File)) {
        close();
        return;
    }

    try {
        await mountCropper(file);
    } catch {
        close();
    }
}

async function onApply(): Promise<void> {
    const selection = getSelection();
    if (!isReady.value || isApplying.value || selection == null) {
        return;
    }

    isApplying.value = true;

    try {
        const croppedFile = await exportCroppedFileFromSelection(selection, {
            fileName: props.fileName,
            mimeType: props.mimeType,
        });

        dialogOpen.value = false;
        emit('apply', croppedFile);
    } finally {
        isApplying.value = false;
    }
}

onBeforeUnmount(() => {
    destroy();
    releaseLocalImageUrl();
});
</script>