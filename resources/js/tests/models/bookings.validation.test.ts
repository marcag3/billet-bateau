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
        });
    });
});
