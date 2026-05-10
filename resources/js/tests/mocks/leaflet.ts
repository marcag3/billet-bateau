import { vi } from 'vitest';

/**
 * Vitest-only Leaflet stub (see `vite.config.ts` resolve alias when `VITEST` is set).
 */
export const leafletClickHandlers: Array<
    (e: { latlng: { lng: number; lat: number } }) => void
> = [];

export function resetLeafletTestHarness(): void {
    leafletClickHandlers.length = 0;
}

export function simulateLeafletMapClick(lng: number, lat: number): void {
    const e = { latlng: { lng, lat } };
    for (const fn of leafletClickHandlers) {
        fn(e);
    }
}

const MockLayer = {
    addTo: vi.fn(function addTo(this: unknown) {
        return this;
    }),
};

export const map = vi.fn(() => ({
    on: vi.fn((ev: string, fn: (e: unknown) => void) => {
        if (ev === 'click') {
            leafletClickHandlers.push(
                fn as (e: { latlng: { lng: number; lat: number } }) => void,
            );
        }
    }),
    off: vi.fn(),
    remove: vi.fn(),
    removeLayer: vi.fn(),
    fitBounds: vi.fn(),
    setView: vi.fn(),
    getZoom: vi.fn(() => 12),
    invalidateSize: vi.fn(),
    dragging: { disable: vi.fn(), enable: vi.fn() },
    doubleClickZoom: { disable: vi.fn(), enable: vi.fn() },
    scrollWheelZoom: { disable: vi.fn(), enable: vi.fn() },
    boxZoom: { disable: vi.fn(), enable: vi.fn() },
    keyboard: { disable: vi.fn(), enable: vi.fn() },
    tap: { disable: vi.fn(), enable: vi.fn() },
}));

export const tileLayer = vi.fn(() => ({ addTo: vi.fn() }));
export const latLng = vi.fn((lat: number, lng: number) => ({ lat, lng }));
export const latLngBounds = vi.fn(() => ({}));
export const polyline = vi.fn(() => ({ ...MockLayer }));
export const circleMarker = vi.fn(() => ({ ...MockLayer }));
