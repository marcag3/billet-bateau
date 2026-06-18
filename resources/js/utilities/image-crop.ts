import type { CropperSelection } from 'cropperjs';

export type ImageCropRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

const DEFAULT_MAX_OUTPUT_DIMENSION = 2048;
const DEFAULT_JPEG_QUALITY = 0.92;

export function normalizeOutputMimeType(mimeType: string): string {
    const normalized = mimeType.trim().toLowerCase();
    if (normalized === 'image/x-png') {
        return 'image/png';
    }

    if (
        normalized === 'image/jpeg' ||
        normalized === 'image/png' ||
        normalized === 'image/webp'
    ) {
        return normalized;
    }

    return 'image/jpeg';
}

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

export function clampCoverPan(
    imageBounds: ImageCropRect,
    selectionBounds: ImageCropRect,
): { x: number; y: number } {
    const minX = selectionBounds.x + selectionBounds.width - imageBounds.width;
    const maxX = selectionBounds.x;
    const minY = selectionBounds.y + selectionBounds.height - imageBounds.height;
    const maxY = selectionBounds.y;

    return {
        x: Math.min(maxX, Math.max(minX, imageBounds.x)),
        y: Math.min(maxY, Math.max(minY, imageBounds.y)),
    };
}

export async function exportCroppedFileFromSelection(
    selection: CropperSelection,
    options: {
        fileName: string;
        mimeType: string;
        maxOutputDimension?: number;
        quality?: number;
    },
): Promise<File> {
    const mimeType = normalizeOutputMimeType(options.mimeType);
    const quality = options.quality ?? DEFAULT_JPEG_QUALITY;
    const maxOutputDimension = options.maxOutputDimension ?? DEFAULT_MAX_OUTPUT_DIMENSION;

    const canvas = await selection.$toCanvas({
        width: maxOutputDimension,
        beforeDraw:
            mimeType === 'image/jpeg'
                ? (context, outputCanvas) => {
                      context.fillStyle = '#ffffff';
                      context.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
                  }
                : undefined,
    });

    return canvasToFile(canvas, options.fileName, mimeType, quality);
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
