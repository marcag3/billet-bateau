import Cropper, {
    EVENT_ACTION,
    type CropperCanvas,
    type CropperImage,
    type CropperSelection,
} from 'cropperjs';
import { onBeforeUnmount, ref, shallowRef } from 'vue';
import {
    clampCoverPan,
    computeCoverBaseScale,
    type ImageCropRect,
} from '../utilities/image-crop';

const MIN_ZOOM_MULTIPLIER = 1;
const MAX_ZOOM_MULTIPLIER = 3;

function buildFixedAspectCropTemplate(aspectRatio: number): string {
    const aspectRatioAttribute =
        aspectRatio > 0 ? ` aspect-ratio="${String(aspectRatio)}"` : '';

    return `<cropper-canvas background>
  <cropper-image scalable translatable></cropper-image>
  <cropper-selection initial-coverage="1" outlined${aspectRatioAttribute}>
    <cropper-grid role="grid" bordered covered></cropper-grid>
    <cropper-crosshair centered></cropper-crosshair>
    <cropper-handle action="move" plain></cropper-handle>
  </cropper-selection>
</cropper-canvas>`;
}

function readImageScale(image: CropperImage): number {
    const [a, b] = image.$getTransform();

    return Math.sqrt(a * a + b * b);
}

function getBoundsInContainer(element: Element, container: Element): ImageCropRect {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return {
        x: elementRect.left - containerRect.left,
        y: elementRect.top - containerRect.top,
        width: elementRect.width,
        height: elementRect.height,
    };
}

function getSelectionBounds(selection: CropperSelection): ImageCropRect {
    return {
        x: selection.x,
        y: selection.y,
        width: selection.width,
        height: selection.height,
    };
}

function centerImageOnSelection(
    cropperImage: CropperImage,
    cropperSelection: CropperSelection,
    canvas: CropperCanvas,
): void {
    const canvasRect = canvas.getBoundingClientRect();
    const targetCenterX = canvasRect.left + cropperSelection.x + cropperSelection.width / 2;
    const targetCenterY = canvasRect.top + cropperSelection.y + cropperSelection.height / 2;
    const imageRect = cropperImage.getBoundingClientRect();
    const imageCenterX = imageRect.left + imageRect.width / 2;
    const imageCenterY = imageRect.top + imageRect.height / 2;

    cropperImage.$move(targetCenterX - imageCenterX, targetCenterY - imageCenterY);
}

function clampImageToSelection(
    cropperImage: CropperImage,
    cropperSelection: CropperSelection,
    canvas: CropperCanvas,
): void {
    const imageBounds = getBoundsInContainer(cropperImage, canvas);
    const clampedPosition = clampCoverPan(imageBounds, getSelectionBounds(cropperSelection));
    const deltaX = clampedPosition.x - imageBounds.x;
    const deltaY = clampedPosition.y - imageBounds.y;

    if (deltaX !== 0 || deltaY !== 0) {
        cropperImage.$move(deltaX, deltaY);
    }
}

function fitImageToCoverSelection(
    cropperImage: CropperImage,
    cropperSelection: CropperSelection,
    canvas: CropperCanvas,
): number {
    const coverScale = computeCoverBaseScale(
        cropperImage.$image.naturalWidth,
        cropperImage.$image.naturalHeight,
        cropperSelection.width,
        cropperSelection.height,
    );

    cropperImage.$resetTransform();
    cropperImage.$scale(coverScale);
    centerImageOnSelection(cropperImage, cropperSelection, canvas);
    clampImageToSelection(cropperImage, cropperSelection, canvas);

    return readImageScale(cropperImage);
}

export function useImageCropper() {
    const cropper = shallowRef<Cropper | null>(null);
    const isReady = ref(false);
    const zoom = ref(MIN_ZOOM_MULTIPLIER);

    let baseImageScale = 1;
    let boundCanvas: CropperCanvas | null = null;
    let onCanvasAction: ((event: Event) => void) | null = null;

    function unbindPanClamping(): void {
        if (boundCanvas != null && onCanvasAction != null) {
            boundCanvas.removeEventListener(EVENT_ACTION, onCanvasAction);
        }

        boundCanvas = null;
        onCanvasAction = null;
    }

    function bindPanClamping(
        canvas: CropperCanvas,
        cropperImage: CropperImage,
        cropperSelection: CropperSelection,
    ): void {
        unbindPanClamping();

        onCanvasAction = () => {
            clampImageToSelection(cropperImage, cropperSelection, canvas);
        };

        canvas.addEventListener(EVENT_ACTION, onCanvasAction);
        boundCanvas = canvas;
    }

    function destroy(): void {
        unbindPanClamping();
        cropper.value?.destroy();
        cropper.value = null;
        baseImageScale = 1;
        zoom.value = MIN_ZOOM_MULTIPLIER;
        isReady.value = false;
    }

    async function mount(
        container: HTMLElement,
        image: HTMLImageElement,
        aspectRatio: number,
    ): Promise<void> {
        destroy();

        cropper.value = new Cropper(image, {
            container,
            template: buildFixedAspectCropTemplate(aspectRatio),
        });

        const cropperImage = cropper.value.getCropperImage();
        const cropperSelection = cropper.value.getCropperSelection();
        const canvas = cropper.value.getCropperCanvas();

        if (cropperImage == null || cropperSelection == null || canvas == null) {
            throw new Error('Unable to initialize cropper.');
        }

        await cropperImage.$ready();

        cropperSelection.$center();
        cropperSelection.$render();

        baseImageScale = fitImageToCoverSelection(cropperImage, cropperSelection, canvas);
        bindPanClamping(canvas, cropperImage, cropperSelection);
        zoom.value = MIN_ZOOM_MULTIPLIER;
        isReady.value = true;
    }

    function setZoomMultiplier(multiplier: number): void {
        const cropperImage = cropper.value?.getCropperImage();
        const cropperSelection = cropper.value?.getCropperSelection();
        const canvas = cropper.value?.getCropperCanvas();

        if (
            cropperImage == null ||
            cropperSelection == null ||
            canvas == null ||
            !isReady.value
        ) {
            return;
        }

        const clampedMultiplier = Math.min(
            MAX_ZOOM_MULTIPLIER,
            Math.max(MIN_ZOOM_MULTIPLIER, multiplier),
        );
        const targetScale = baseImageScale * clampedMultiplier;
        const delta = targetScale / readImageScale(cropperImage) - 1;

        if (delta !== 0) {
            const canvasRect = canvas.getBoundingClientRect();
            const zoomOriginX = canvasRect.left + cropperSelection.x + cropperSelection.width / 2;
            const zoomOriginY = canvasRect.top + cropperSelection.y + cropperSelection.height / 2;

            cropperImage.$zoom(delta, zoomOriginX, zoomOriginY);
            clampImageToSelection(cropperImage, cropperSelection, canvas);
        }
    }

    function getSelection(): CropperSelection | null {
        return cropper.value?.getCropperSelection() ?? null;
    }

    onBeforeUnmount(destroy);

    return {
        isReady,
        zoom,
        minZoomMultiplier: MIN_ZOOM_MULTIPLIER,
        maxZoomMultiplier: MAX_ZOOM_MULTIPLIER,
        mount,
        destroy,
        setZoomMultiplier,
        getSelection,
    };
}
