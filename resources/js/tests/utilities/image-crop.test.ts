import { describe, expect, it } from 'vitest';
import {
    computeCoverBaseScale,
    computeCropGeometryForViewport,
    computeInitialCropTransform,
    computeOutputDimensions,
    computeSourceCropRect,
} from '../../utilities/image-crop';

describe('image-crop utilities', () => {
    it('computes crop geometry that fits inside the viewport', () => {
        const geometry = computeCropGeometryForViewport(400, 300, 16 / 9);

        expect(geometry.cropWidth).toBeLessThanOrEqual(360);
        expect(geometry.cropHeight).toBeLessThanOrEqual(270);
        expect(geometry.cropWidth / geometry.cropHeight).toBeCloseTo(16 / 9, 5);
    });

    it('uses a cover scale so the crop window is filled initially', () => {
        const geometry = computeCropGeometryForViewport(400, 300, 1);
        const transform = computeInitialCropTransform(800, 400, geometry);

        expect(transform.zoom).toBe(1);
        expect(transform.panX).toBe(0);
        expect(transform.panY).toBe(0);
        expect(transform.baseScale).toBe(
            computeCoverBaseScale(800, 400, geometry.cropWidth, geometry.cropHeight),
        );
    });

    it('maps the centered crop window back to source pixels', () => {
        const geometry = computeCropGeometryForViewport(400, 300, 1);
        const transform = computeInitialCropTransform(800, 800, geometry);
        const sourceRect = computeSourceCropRect(800, 800, transform, geometry);

        expect(sourceRect.width).toBeGreaterThan(0);
        expect(sourceRect.height).toBeGreaterThan(0);
        expect(sourceRect.x).toBeGreaterThanOrEqual(0);
        expect(sourceRect.y).toBeGreaterThanOrEqual(0);
        expect(sourceRect.x + sourceRect.width).toBeLessThanOrEqual(800);
        expect(sourceRect.y + sourceRect.height).toBeLessThanOrEqual(800);
    });

    it('scales output dimensions down to the configured maximum', () => {
        const output = computeOutputDimensions(4000, 2250, 2048);

        expect(Math.max(output.width, output.height)).toBeLessThanOrEqual(2048);
        expect(output.width / output.height).toBeCloseTo(4000 / 2250, 5);
    });
});
