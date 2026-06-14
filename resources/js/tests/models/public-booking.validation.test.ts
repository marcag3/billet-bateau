import { describe, it, expect } from 'vitest';
import { createPublicBookingContactZodSchema } from '../../models/public-booking/public-booking.validation';

const t = (key: string): string => key;

describe('public booking contact validation', () => {
    it('requires a two-letter country code', () => {
        const schema = createPublicBookingContactZodSchema(t);

        expect(() =>
            schema.parse({
                contact_name: 'Alex',
                contact_email: 'alex@example.com',
                country: '',
            }),
        ).toThrow();

        expect(
            schema.parse({
                contact_name: 'Alex',
                contact_email: 'alex@example.com',
                country: 'CA',
            }),
        ).toMatchObject({
            country: 'CA',
        });

        expect(
            schema.parse({
                contact_name: 'Alex',
                contact_email: 'alex@example.com',
                country: 'ca',
            }),
        ).toMatchObject({
            country: 'CA',
        });
    });
});
