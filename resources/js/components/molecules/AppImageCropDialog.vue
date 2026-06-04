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
                <div
                    ref="viewportRef"
                    class="crop-viewport relative overflow-hidden rounded-borders bg-grey-9"
                    :style="viewportStyle"
                    @wheel.prevent="onWheel"
                    @pointerdown="onPointerDown"
                    @pointermove="onPointerMove"
                    @pointerup="onPointerUp"
                    @pointercancel="onPointerUp"
                    @pointerleave="onPointerUp"
                >
                    <img
                        v-show="isReady"
                        ref="imageRef"
                        :src="imageUrl"
                        alt=""
                        draggable="false"
                        class="crop-image absolute select-none"
                        :style="imageStyle"
                        @load="onImageElementLoad"
                    />

                    <div
                        v-if="isReady"
                        class="absolute pointer-events-none crop-frame"
                        :style="cropFrameStyle"
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
import {
    computed,
    nextTick,
    onBeforeUnmount,
    ref,
    useTemplateRef,
    watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import {
    computeCropGeometryForViewport,
    computeInitialCropTransform,
    exportCroppedImageFile,
    type ImageCropTransform,
} from '../../utilities/image-crop';

const VIEWPORT_HEIGHT_PX = 320;

const props = defineProps<{
    imageUrl: string;
    sourceFile: File | null;
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

const viewportRef = useTemplateRef<HTMLElement>('viewportRef');
const imageRef = useTemplateRef<HTMLImageElement>('imageRef');
const viewportWidth = ref(0);
const imageLoaded = ref(false);
const layoutReady = ref(false);
const isApplying = ref(false);
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);
const baseScale = ref(1);
const naturalWidth = ref(0);
const naturalHeight = ref(0);

let resizeObserver: ResizeObserver | null = null;
let activePointerId: number | null = null;
let panStartX = 0;
let panStartY = 0;
let panOriginX = 0;
let panOriginY = 0;

const isReady = computed(() => imageLoaded.value && layoutReady.value);

const viewportStyle = computed(() => ({
    height: `${String(VIEWPORT_HEIGHT_PX)}px`,
    touchAction: 'none',
}));

const cropGeometry = computed(() =>
    computeCropGeometryForViewport(
        viewportWidth.value,
        VIEWPORT_HEIGHT_PX,
        props.aspectRatio,
    ),
);

const cropTransform = computed<ImageCropTransform>(() => ({
    baseScale: baseScale.value,
    zoom: zoom.value,
    panX: panX.value,
    panY: panY.value,
}));

const cropFrameStyle = computed(() => {
    const geometry = cropGeometry.value;

    return {
        width: `${String(geometry.cropWidth)}px`,
        height: `${String(geometry.cropHeight)}px`,
        left: `${String((geometry.viewportWidth - geometry.cropWidth) / 2)}px`,
        top: `${String((geometry.viewportHeight - geometry.cropHeight) / 2)}px`,
    };
});

const imageStyle = computed(() => {
    const geometry = cropGeometry.value;
    const displayedWidth = naturalWidth.value * baseScale.value * zoom.value;
    const displayedHeight = naturalHeight.value * baseScale.value * zoom.value;
    const left = geometry.viewportWidth / 2 - displayedWidth / 2 + panX.value;
    const top = geometry.viewportHeight / 2 - displayedHeight / 2 + panY.value;

    return {
        width: `${String(displayedWidth)}px`,
        height: `${String(displayedHeight)}px`,
        left: `${String(left)}px`,
        top: `${String(top)}px`,
    };
});

function resetInteractionState(): void {
    zoom.value = 1;
    panX.value = 0;
    panY.value = 0;
    baseScale.value = 1;
    naturalWidth.value = 0;
    naturalHeight.value = 0;
    imageLoaded.value = false;
    layoutReady.value = false;
    viewportWidth.value = 0;
    isApplying.value = false;
    activePointerId = null;
}

function measureViewport(): boolean {
    const element = viewportRef.value;
    if (element == null) {
        return false;
    }

    const width = element.clientWidth;
    if (width <= 0) {
        return false;
    }

    viewportWidth.value = width;
    return true;
}

async function waitForViewportWidth(): Promise<boolean> {
    for (let attempt = 0; attempt < 12; attempt += 1) {
        await nextTick();
        if (measureViewport()) {
            return true;
        }

        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => {
                resolve();
            });
        });
    }

    return false;
}

function applyTransformFromNaturalSize(): void {
    if (naturalWidth.value <= 0 || naturalHeight.value <= 0 || viewportWidth.value <= 0) {
        return;
    }

    const initial = computeInitialCropTransform(
        naturalWidth.value,
        naturalHeight.value,
        cropGeometry.value,
    );

    baseScale.value = initial.baseScale;
    zoom.value = initial.zoom;
    panX.value = initial.panX;
    panY.value = initial.panY;
    layoutReady.value = true;
}

async function onImageElementLoad(): Promise<void> {
    const image = imageRef.value;
    if (image == null || image.naturalWidth <= 0) {
        return;
    }

    try {
        await image.decode();
    } catch {
        // decode() rejects on broken images; natural dimensions may still be usable.
    }

    naturalWidth.value = image.naturalWidth;
    naturalHeight.value = image.naturalHeight;
    imageLoaded.value = true;
    applyTransformFromNaturalSize();
}

async function prepareCropSurface(): Promise<void> {
    resetInteractionState();

    const hasViewport = await waitForViewportWidth();
    if (!hasViewport) {
        throw new Error('Unable to measure crop viewport.');
    }

    const image = imageRef.value;
    if (image != null && image.complete && image.naturalWidth > 0) {
        onImageElementLoad();
    }
}

function disconnectResizeObserver(): void {
    resizeObserver?.disconnect();
    resizeObserver = null;
}

function connectResizeObserver(): void {
    disconnectResizeObserver();

    const element = viewportRef.value;
    if (element == null) {
        return;
    }

    resizeObserver = new ResizeObserver(() => {
        const previousWidth = viewportWidth.value;
        if (!measureViewport()) {
            return;
        }

        if (
            imageLoaded.value &&
            Math.abs(viewportWidth.value - previousWidth) > 1
        ) {
            applyTransformFromNaturalSize();
        }
    });
    resizeObserver.observe(element);
}

function onWheel(event: WheelEvent): void {
    if (!isReady.value) {
        return;
    }

    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    zoom.value = clamp(zoom.value + delta, 1, 3);
}

function onPointerDown(event: PointerEvent): void {
    if (!isReady.value || activePointerId != null) {
        return;
    }

    activePointerId = event.pointerId;
    panStartX = event.clientX;
    panStartY = event.clientY;
    panOriginX = panX.value;
    panOriginY = panY.value;
    event.currentTarget?.setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent): void {
    if (activePointerId !== event.pointerId) {
        return;
    }

    panX.value = panOriginX + (event.clientX - panStartX);
    panY.value = panOriginY + (event.clientY - panStartY);
}

function onPointerUp(event: PointerEvent): void {
    if (activePointerId !== event.pointerId) {
        return;
    }

    activePointerId = null;
    event.currentTarget?.releasePointerCapture(event.pointerId);
}

function onCancel(): void {
    dialogOpen.value = false;
    emit('cancel');
}

function onDialogHide(): void {
    disconnectResizeObserver();
    resetInteractionState();
}

async function onDialogShow(): Promise<void> {
    connectResizeObserver();

    try {
        await prepareCropSurface();
    } catch {
        dialogOpen.value = false;
        emit('cancel');
    }
}

async function onApply(): Promise<void> {
    if (!isReady.value || isApplying.value) {
        return;
    }

    const sourceFile = props.sourceFile;
    if (sourceFile == null || naturalWidth.value <= 0 || naturalHeight.value <= 0) {
        return;
    }

    isApplying.value = true;

    try {
        const croppedFile = await exportCroppedImageFile({
            source: sourceFile,
            imageWidth: naturalWidth.value,
            imageHeight: naturalHeight.value,
            transform: cropTransform.value,
            geometry: cropGeometry.value,
            fileName: props.fileName,
            mimeType: props.mimeType,
        });

        dialogOpen.value = false;
        emit('apply', croppedFile);
    } finally {
        isApplying.value = false;
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

watch(
    () => props.imageUrl,
    async () => {
        if (!dialogOpen.value) {
            return;
        }

        layoutReady.value = false;
        imageLoaded.value = false;

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
            disconnectResizeObserver();
            resetInteractionState();
        }
    },
);

onBeforeUnmount(() => {
    disconnectResizeObserver();
});
</script>

<style scoped>
.crop-viewport {
    width: 100%;
}

.crop-image {
    max-width: none;
    max-height: none;
}

.crop-frame {
    box-shadow: 0 0 0 9999px rgb(0 0 0 / 55%);
    border: 2px solid #fff;
}
</style>
