import { describe, expect, it } from 'vitest';
import { computeTripCardItemSize } from '../../composables/useControlPanelTripLaneLayout';

describe('computeTripCardItemSize', () => {
    it('derives card width from lane height using the 5:12 aspect ratio', () => {
        expect(computeTripCardItemSize(600)).toBe(250);
        expect(computeTripCardItemSize(480)).toBe(200);
    });

    it('never goes below the minimum lane height', () => {
        expect(computeTripCardItemSize(100)).toBe(Math.round(400 * (5 / 12)));
    });
});
