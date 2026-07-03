import { describe, it, expect } from 'vitest';
import { createWalkInBookingContactZodSchema } from '../../models/public-booking/public-booking.validation';

const t = (key: string): string => key;

describe('walk-in booking contact validation', () => {
    it('allows an empty contact email', () => {
        const schema = createWalkInBookingContactZodSchema(t);

        expect(
            schema.parse({
                contact_name: 'Alex',
                contact_email: '',
                country: 'CA',
            }),
        ).toMatchObject({
            contact_email: null,
            country: 'CA',
        });
    });

    it('rejects an invalid contact email', () => {
        const schema = createWalkInBookingContactZodSchema(t);

        expect(() =>
            schema.parse({
                contact_name: 'Alex',
                contact_email: 'not-an-email',
                country: 'CA',
            }),
        ).toThrow();
    });
});
