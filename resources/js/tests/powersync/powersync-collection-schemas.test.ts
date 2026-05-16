import { describe, expect, it } from 'vitest';
import { boatsSchema } from '../../powersync/boats.collection';
import { programSchema } from '../../powersync/programs.collection';
import { productsSchema } from '../../powersync/products.collection';
import { tripsSchema } from '../../powersync/trips.collection';

describe('PowerSync collection Zod schemas', () => {
    it('parses program rows without timestamp columns', () => {
        const parsed = programSchema.parse({
            id: '01HQABCDEFGHJKMNPQRSTVWXYZ',
            name: 'Dockside',
            description: null,
            theme_color: '#08758A',
            is_active: 1,
            is_archived: 0,
            slug: 'dockside',
            line_1: null,
            line_2: null,
            city: null,
            postal_code: null,
            country: null,
            banner_object_key: null,
            banner_mime_type: null,
            banner_size_bytes: null,
            banner_etag: null,
            banner_uploaded_at: null,
        });
        expect(parsed.id).toBe('01HQABCDEFGHJKMNPQRSTVWXYZ');
        expect(parsed.name).toBe('Dockside');
    });

    it('parses boat rows without timestamp columns', () => {
        const parsed = boatsSchema.parse({
            id: '01HQABCDEFGHJKMNPQRSTVWXYZ',
            boat_type_id: null,
            program_id: '01HQBBBBBBBBBBBBBBBBBBBBBB',
            name: 'Launch',
            capacity: 12,
            notes: null,
        });
        expect(parsed.name).toBe('Launch');
    });

    it('parses product rows without timestamp columns', () => {
        const parsed = productsSchema.parse({
            id: '01HQABCDEFGHJKMNPQRSTVWXYZ',
            program_id: '01HQBBBBBBBBBBBBBBBBBBBBBB',
            boat_type_id: null,
            water_route_id: null,
            capacity: 10,
            name: 'Rabaska tour',
            description: null,
            banner_object_key: null,
            banner_mime_type: null,
            banner_size_bytes: null,
            banner_etag: null,
            banner_uploaded_at: null,
        });
        expect(parsed.capacity).toBe(10);
    });

    it('parses trip rows with product_id', () => {
        const parsed = tripsSchema.parse({
            id: '01HQCCCCCCCCCCCCCCCCCCCCCC',
            program_id: '01HQBBBBBBBBBBBBBBBBBBBBBB',
            product_id: '01HQABCDEFGHJKMNPQRSTVWXYZ',
            scheduled_departure_at: '2026-08-10T15:30:00.000Z',
        });
        expect(parsed.product_id).toBe('01HQABCDEFGHJKMNPQRSTVWXYZ');
        expect(parsed.scheduled_departure_at).toBeInstanceOf(Date);
    });
});
