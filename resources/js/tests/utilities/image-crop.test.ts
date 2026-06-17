import { describe, expect, it, vi } from 'vitest';
import {
    exportCroppedFileFromCropper,
    normalizeOutputMimeType,
} from '../../utilities/image-crop';

describe('image-crop utilities', () => {
    it('normalizes supported mime types', () => {
        expect(normalizeOutputMimeType('image/png')).toBe('image/png');
        expect(normalizeOutputMimeType('image/x-png')).toBe('image/png');
        expect(normalizeOutputMimeType('image/webp')).toBe('image/webp');
        expect(normalizeOutputMimeType('image/jpeg')).toBe('image/jpeg');
        expect(normalizeOutputMimeType('application/octet-stream')).toBe('image/jpeg');
    });

    it('exports a cropped file from cropper canvas output', async () => {
        const toBlob = vi.fn((callback: BlobCallback) => {
            callback(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));
        });
        const canvas = {
            toBlob,
        } as unknown as HTMLCanvasElement;

        const cropper = {
            getCroppedCanvas: vi.fn(() => canvas),
        };

        const croppedFile = await exportCroppedFileFromCropper(cropper as never, {
            fileName: 'photo.png',
            mimeType: 'image/png',
        });

        expect(cropper.getCroppedCanvas).toHaveBeenCalledWith({
            maxWidth: 2048,
            maxHeight: 2048,
            fillColor: 'transparent',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });
        expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', undefined);
        expect(croppedFile.type).toBe('image/png');
        expect(croppedFile.name).toBe('photo.png');
    });

    it('fills jpeg exports with a white background', async () => {
        const toBlob = vi.fn((callback: BlobCallback) => {
            callback(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }));
        });
        const canvas = {
            toBlob,
        } as unknown as HTMLCanvasElement;

        const cropper = {
            getCroppedCanvas: vi.fn(() => canvas),
        };

        await exportCroppedFileFromCropper(cropper as never, {
            fileName: 'photo.jpg',
            mimeType: 'image/jpeg',
        });

        expect(cropper.getCroppedCanvas).toHaveBeenCalledWith({
            maxWidth: 2048,
            maxHeight: 2048,
            fillColor: '#ffffff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });
        expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.92);
    });
});
