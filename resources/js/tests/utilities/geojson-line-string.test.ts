import { describe, expect, it } from 'vitest';
import {
    isPersistableLineStringGeoJson,
    parseLineStringGeoJson,
    stringifyLineStringGeoJson,
    type LineStringGeoJson,
} from '../../utilities/geojson-line-string';

describe('geojson-line-string', () => {
    it('parses a valid LineString with two coordinates', () => {
        const raw =
            '{"type":"LineString","coordinates":[[-73.5673,45.5017],[-73.554,45.508]]}';
        const parsed = parseLineStringGeoJson(raw);
        expect(parsed).toEqual({
            type: 'LineString',
            coordinates: [
                [-73.5673, 45.5017],
                [-73.554, 45.508],
            ],
        });
        expect(isPersistableLineStringGeoJson(raw)).toBe(true);
    });

    it('parses a single coordinate for in-progress UI state', () => {
        const raw = '{"type":"LineString","coordinates":[[-73.5,45.5]]}';
        expect(parseLineStringGeoJson(raw)?.coordinates).toHaveLength(1);
        expect(isPersistableLineStringGeoJson(raw)).toBe(false);
    });

    it('returns null for invalid JSON', () => {
        expect(parseLineStringGeoJson('not json')).toBeNull();
        expect(isPersistableLineStringGeoJson('not json')).toBe(false);
    });

    it('stringifies coordinates deterministically', () => {
        const value: LineStringGeoJson = {
            type: 'LineString',
            coordinates: [
                [1, 2],
                [3, 4],
            ],
        };
        expect(stringifyLineStringGeoJson(value)).toBe(
            '{"type":"LineString","coordinates":[[1,2],[3,4]]}',
        );
    });
});
