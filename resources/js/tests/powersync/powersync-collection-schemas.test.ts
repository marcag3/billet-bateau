import { describe, expect, it } from 'vitest';
import { boatsSchema } from '../../powersync/boats.collection';
import { programSchema } from '../../powersync/programs.collection';
import { mediaSchema } from '../../powersync/media.collection';

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

    it('parses media rows without timestamps', () => {
        const parsed = mediaSchema.parse({
            id: '42',
            program_id: '01HQCCCCCCCCCCCCCCCCCCCCCC',
            model_type: 'App\\Models\\Program',
            model_id: '01HQDDDDDDDDDDDDDDDDDDDDDD',
            uuid: null,
            collection_name: 'images',
            name: 'Hero',
            file_name: 'hero.jpg',
            mime_type: 'image/jpeg',
            disk: 'public',
            conversions_disk: null,
            size: 1024,
            manipulations: '{}',
            custom_properties: '{}',
            generated_conversions: '{}',
            responsive_images: '{}',
            order_column: 0,
        });
        expect(parsed.id).toBe('42');
    });
});
