import { describe, expect, it } from 'vitest';
import { createProgramEditZodSchema } from '../../models/programs/programs.validation';

describe('Program edit schema normalization', () => {
    it('normalizes edit form fields through zod preprocess/transform rules', async () => {
        const t = (key: string) => key;
        const schema = createProgramEditZodSchema(t);

        const parsed = schema.parse({
            name: '  Harbor North  ',
            description: '  Optional description  ',
            themeColor: '#a1b2c3',
            slug: '  Bôat  Program  ',
            isActive: true,
            isArchived: false,
            startDate: '2026-06-01',
            endDate: '2026-06-30',
            bookingQuestionsText: '  First 3 characters of postal code  ',
            address: {
                line_1: '  123 Pier Road  ',
                line_2: '  ',
                city: '  Kingston  ',
                postal_code: '  K7L 2Y7  ',
                country: '  Canada  ',
            },
        });

        expect(parsed.name).toBe('Harbor North');
        expect(parsed.description).toBe('Optional description');
        expect(parsed.themeColor).toBe('#A1B2C3');
        expect(parsed.slug).toBe('boat-program');
        expect(parsed.bookingQuestionsText).toBe('  First 3 characters of postal code  ');
        expect(parsed.address).toEqual({
            line_1: '123 Pier Road',
            line_2: '',
            city: 'Kingston',
            postal_code: 'K7L 2Y7',
            country: 'Canada',
        });
    });
});
