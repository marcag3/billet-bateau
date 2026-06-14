/**
 * Helpers for GeoJSON LineString (SRID 4326: [lng, lat] order).
 */

export type LineStringGeoJson = {
    type: 'LineString';
    coordinates: [number, number][];
};

export function parseLineStringGeoJson(raw: string | undefined | null): LineStringGeoJson | null {
    const trimmed = raw != null ? String(raw).trim() : '';
    if (trimmed.length === 0) {
        return null;
    }
    try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            (parsed as { type?: unknown }).type === 'LineString' &&
            Array.isArray((parsed as LineStringGeoJson).coordinates)
        ) {
            const coords = (parsed as LineStringGeoJson).coordinates;
            if (
                coords.length >= 1 &&
                coords.every(
                    (c) =>
                        Array.isArray(c) &&
                        c.length >= 2 &&
                        typeof c[0] === 'number' &&
                        typeof c[1] === 'number' &&
                        Number.isFinite(c[0]) &&
                        Number.isFinite(c[1]),
                )
            ) {
                return {
                    type: 'LineString',
                    coordinates: coords.map((c) => [c[0], c[1]] as [number, number]),
                };
            }
        }
    } catch {
        return null;
    }
    return null;
}

export function stringifyLineStringGeoJson(value: LineStringGeoJson): string {
    return JSON.stringify({
        type: 'LineString',
        coordinates: value.coordinates.map(([lng, lat]) => [lng, lat]),
    });
}

/** True when non-empty and suitable for PowerSync / backend LineString (≥ 2 vertices). */
export function isPersistableLineStringGeoJson(raw: string | undefined | null): boolean {
    const parsed = parseLineStringGeoJson(raw);
    return parsed !== null && parsed.coordinates.length >= 2;
}
