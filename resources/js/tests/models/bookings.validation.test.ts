import { describe, expect, it } from 'vitest';
import { createBookingEditFormZodSchema } from '../../models/bookings/bookings.validation';

const t = (key: string): string => key;

describe('booking edit form validation', () => {
    it('accepts null contact email after preprocess', () => {
        const schema = createBookingEditFormZodSchema(t);

        expect(
            schema.parse({
                tripId: 'trip-1',
                contact_name: 'Alex',
                contact_email: null,
            }),
        ).toMatchObject({
            tripId: 'trip-1',
            contact_name: 'Alex',
            contact_email: null,
        });
    });

    it('accepts empty contact email', () => {
        const schema = createBookingEditFormZodSchema(t);

        expect(
            schema.parse({
                tripId: 'trip-1',
                contact_name: 'Alex',
                contact_email: '',
            }),
        ).toMatchObject({
            contact_email: null,
            contact_phone: null,
        });
    });

    it('accepts optional phone and rejects invalid phone', () => {
        const schema = createBookingEditFormZodSchema(t);

        expect(
            schema.parse({
                tripId: 'trip-1',
                contact_name: 'Alex',
                contact_email: null,
                contact_phone: '(514) 555-1234',
            }),
        ).toMatchObject({
            contact_phone: '(514) 555-1234',
        });

        expect(() =>
            schema.parse({
                tripId: 'trip-1',
                contact_name: 'Alex',
                contact_email: null,
                contact_phone: 'nope',
            }),
        ).toThrow();
    });
});
