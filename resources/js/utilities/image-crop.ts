import type Cropper from 'cropperjs';

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

export async function exportCroppedFileFromCropper(
    cropper: Cropper,
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

    const canvas = cropper.getCroppedCanvas({
        maxWidth: maxOutputDimension,
        maxHeight: maxOutputDimension,
        fillColor: mimeType === 'image/jpeg' ? '#ffffff' : 'transparent',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    if (canvas == null) {
        throw new Error('Unable to export cropped image.');
    }

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
