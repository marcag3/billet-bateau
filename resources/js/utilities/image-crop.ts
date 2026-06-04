export type ImageCropTransform = {
    baseScale: number;
    zoom: number;
    panX: number;
    panY: number;
};

export type ImageCropGeometry = {
    cropWidth: number;
    cropHeight: number;
    viewportWidth: number;
    viewportHeight: number;
};

const DEFAULT_MAX_OUTPUT_DIMENSION = 2048;
const DEFAULT_JPEG_QUALITY = 0.92;

export function computeCoverBaseScale(
    imageWidth: number,
    imageHeight: number,
    cropWidth: number,
    cropHeight: number,
): number {
    if (imageWidth <= 0 || imageHeight <= 0 || cropWidth <= 0 || cropHeight <= 0) {
        return 1;
    }

    return Math.max(cropWidth / imageWidth, cropHeight / imageHeight);
}

export function computeInitialCropTransform(
    imageWidth: number,
    imageHeight: number,
    geometry: ImageCropGeometry,
): ImageCropTransform {
    return {
        baseScale: computeCoverBaseScale(
            imageWidth,
            imageHeight,
            geometry.cropWidth,
            geometry.cropHeight,
        ),
        zoom: 1,
        panX: 0,
        panY: 0,
    };
}

export function computeCropGeometryForViewport(
    viewportWidth: number,
    viewportHeight: number,
    aspectRatio: number,
    paddingRatio = 0.9,
): ImageCropGeometry {
    const safeAspectRatio = aspectRatio > 0 ? aspectRatio : 1;
    const maxCropWidth = viewportWidth * paddingRatio;
    const maxCropHeight = viewportHeight * paddingRatio;

    let cropWidth = maxCropWidth;
    let cropHeight = cropWidth / safeAspectRatio;

    if (cropHeight > maxCropHeight) {
        cropHeight = maxCropHeight;
        cropWidth = cropHeight * safeAspectRatio;
    }

    return {
        cropWidth,
        cropHeight,
        viewportWidth,
        viewportHeight,
    };
}

export function computeDisplayedImageSize(
    imageWidth: number,
    imageHeight: number,
    transform: ImageCropTransform,
): { width: number; height: number } {
    const scale = transform.baseScale * transform.zoom;

    return {
        width: imageWidth * scale,
        height: imageHeight * scale,
    };
}

export function computeImageTopLeft(
    viewportWidth: number,
    viewportHeight: number,
    displayedWidth: number,
    displayedHeight: number,
    panX: number,
    panY: number,
): { x: number; y: number } {
    return {
        x: viewportWidth / 2 - displayedWidth / 2 + panX,
        y: viewportHeight / 2 - displayedHeight / 2 + panY,
    };
}

export function computeSourceCropRect(
    imageWidth: number,
    imageHeight: number,
    transform: ImageCropTransform,
    geometry: ImageCropGeometry,
): { x: number; y: number; width: number; height: number } {
    const displayed = computeDisplayedImageSize(imageWidth, imageHeight, transform);
    const imageTopLeft = computeImageTopLeft(
        geometry.viewportWidth,
        geometry.viewportHeight,
        displayed.width,
        displayed.height,
        transform.panX,
        transform.panY,
    );

    const cropLeft = geometry.viewportWidth / 2 - geometry.cropWidth / 2;
    const cropTop = geometry.viewportHeight / 2 - geometry.cropHeight / 2;

    const rawX = ((cropLeft - imageTopLeft.x) / displayed.width) * imageWidth;
    const rawY = ((cropTop - imageTopLeft.y) / displayed.height) * imageHeight;
    const rawWidth = (geometry.cropWidth / displayed.width) * imageWidth;
    const rawHeight = (geometry.cropHeight / displayed.height) * imageHeight;

    const x = clamp(rawX, 0, imageWidth);
    const y = clamp(rawY, 0, imageHeight);
    const width = clamp(rawWidth, 1, imageWidth - x);
    const height = clamp(rawHeight, 1, imageHeight - y);

    return { x, y, width, height };
}

export function computeOutputDimensions(
    cropWidth: number,
    cropHeight: number,
    maxOutputDimension = DEFAULT_MAX_OUTPUT_DIMENSION,
): { width: number; height: number } {
    const longestEdge = Math.max(cropWidth, cropHeight);
    if (longestEdge <= maxOutputDimension) {
        return {
            width: Math.round(cropWidth),
            height: Math.round(cropHeight),
        };
    }

    const scale = maxOutputDimension / longestEdge;

    return {
        width: Math.max(1, Math.round(cropWidth * scale)),
        height: Math.max(1, Math.round(cropHeight * scale)),
    };
}

export async function exportCroppedImageFile(options: {
    source: File | Blob;
    imageWidth: number;
    imageHeight: number;
    transform: ImageCropTransform;
    geometry: ImageCropGeometry;
    fileName: string;
    mimeType: string;
    maxOutputDimension?: number;
    quality?: number;
}): Promise<File> {
    const sourceRect = computeSourceCropRect(
        options.imageWidth,
        options.imageHeight,
        options.transform,
        options.geometry,
    );
    const outputSize = computeOutputDimensions(
        options.geometry.cropWidth,
        options.geometry.cropHeight,
        options.maxOutputDimension,
    );
    const mimeType = normalizeOutputMimeType(options.mimeType);
    const quality = options.quality ?? DEFAULT_JPEG_QUALITY;

    const canvas = document.createElement('canvas');
    canvas.width = outputSize.width;
    canvas.height = outputSize.height;

    const context = canvas.getContext('2d');
    if (context == null) {
        throw new Error('Unable to create canvas context.');
    }

    if (mimeType === 'image/jpeg') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    await drawSourceCropToCanvas(context, options.source, sourceRect, outputSize);

    return canvasToFile(canvas, options.fileName, mimeType, quality);
}

async function drawSourceCropToCanvas(
    context: CanvasRenderingContext2D,
    source: File | Blob,
    sourceRect: { x: number; y: number; width: number; height: number },
    outputSize: { width: number; height: number },
): Promise<void> {
    const cropX = Math.round(sourceRect.x);
    const cropY = Math.round(sourceRect.y);
    const cropWidth = Math.max(1, Math.round(sourceRect.width));
    const cropHeight = Math.max(1, Math.round(sourceRect.height));

    if (typeof createImageBitmap === 'function') {
        const bitmap = await createImageBitmap(source, cropX, cropY, cropWidth, cropHeight, {
            resizeWidth: outputSize.width,
            resizeHeight: outputSize.height,
            resizeQuality: 'high',
        });

        try {
            context.drawImage(bitmap, 0, 0, outputSize.width, outputSize.height);
            return;
        } finally {
            bitmap.close();
        }
    }

    const image = await loadImageElementFromBlob(source);
    try {
        await image.decode();
    } catch {
        // decode() rejects on broken images; drawImage may still succeed.
    }

    context.drawImage(
        image,
        sourceRect.x,
        sourceRect.y,
        sourceRect.width,
        sourceRect.height,
        0,
        0,
        outputSize.width,
        outputSize.height,
    );
}

function loadImageElementFromBlob(source: File | Blob): Promise<HTMLImageElement> {
    const objectUrl = URL.createObjectURL(source);

    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Unable to load image for cropping.'));
        };
        image.src = objectUrl;
    });
}

function canvasToFile(
    canvas: HTMLCanvasElement,
    fileName: string,
    mimeType: string,
    quality: number,
): Promise<File> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob == null) {
                    reject(new Error('Unable to export cropped image.'));
                    return;
                }

                resolve(
                    new File([blob], fileName, {
                        type: mimeType,
                        lastModified: Date.now(),
                    }),
                );
            },
            mimeType,
            mimeType === 'image/jpeg' ? quality : undefined,
        );
    });
}

function normalizeOutputMimeType(mimeType: string): string {
    const normalized = mimeType.trim().toLowerCase();
    if (
        normalized === 'image/jpeg' ||
        normalized === 'image/png' ||
        normalized === 'image/webp'
    ) {
        return normalized;
    }

    return 'image/jpeg';
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}
