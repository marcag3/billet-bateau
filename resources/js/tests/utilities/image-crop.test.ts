import { describe, expect, it, vi } from 'vitest';
import {
    clampCoverPan,
    computeCoverBaseScale,
    exportCroppedFileFromSelection,
    normalizeOutputMimeType,
} from '../../utilities/image-crop';

describe('image-crop utilities', () => {
    it('uses a cover scale so the crop window is filled initially', () => {
        expect(computeCoverBaseScale(800, 400, 300, 300)).toBe(0.75);
        expect(computeCoverBaseScale(800, 800, 300, 300)).toBeCloseTo(0.375, 5);
    });

    it('clamps pan so the image always covers the selection', () => {
        const selection = { x: 50, y: 50, width: 300, height: 300 };

        expect(
            clampCoverPan({ x: 80, y: 50, width: 400, height: 400 }, selection),
        ).toEqual({ x: 50, y: 50 });
        expect(
            clampCoverPan({ x: 0, y: 90, width: 400, height: 400 }, selection),
        ).toEqual({ x: 0, y: 50 });
        expect(
            clampCoverPan({ x: -60, y: 50, width: 400, height: 400 }, selection),
        ).toEqual({ x: -50, y: 50 });
    });

    it('normalizes supported mime types', () => {
        expect(normalizeOutputMimeType('image/png')).toBe('image/png');
        expect(normalizeOutputMimeType('image/x-png')).toBe('image/png');
        expect(normalizeOutputMimeType('image/webp')).toBe('image/webp');
        expect(normalizeOutputMimeType('image/jpeg')).toBe('image/jpeg');
        expect(normalizeOutputMimeType('application/octet-stream')).toBe('image/jpeg');
    });

    it('exports a cropped file from cropper selection canvas output', async () => {
        const toBlob = vi.fn((callback: BlobCallback) => {
            callback(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }));
        });
        const canvas = {
            toBlob,
        } as unknown as HTMLCanvasElement;

        const selection = {
            $toCanvas: vi.fn(async () => canvas),
        };

        const croppedFile = await exportCroppedFileFromSelection(selection as never, {
            fileName: 'photo.png',
            mimeType: 'image/png',
        });

        expect(selection.$toCanvas).toHaveBeenCalledWith({
            width: 2048,
            beforeDraw: undefined,
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

        const selection = {
            $toCanvas: vi.fn(async () => canvas),
        };

        await exportCroppedFileFromSelection(selection as never, {
            fileName: 'photo.jpg',
            mimeType: 'image/jpeg',
        });

        expect(selection.$toCanvas).toHaveBeenCalledWith({
            width: 2048,
            beforeDraw: expect.any(Function),
        });
        expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.92);
    });
});
