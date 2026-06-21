import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { createPublicBookingContactZodSchema } from '../public-booking/public-booking.validation';
import { zRequiredTrimmedString } from '../../validation/zod-fields';

export type Translator = (key: string) => string;

export function createBookingAdminFormZodSchema(t: Translator) {
    return createPublicBookingContactZodSchema(t).extend({
        tripId: zRequiredTrimmedString(t('programsControlAdmin.tripRequired')),
    });
}

export type BookingAdminFormValues = z.infer<
    ReturnType<typeof createBookingAdminFormZodSchema>
>;

export function createBookingAdminFormSchema(t: Translator) {
    return toTypedSchema(createBookingAdminFormZodSchema(t));
}

export function createBookingTicketRowZodSchema(t: Translator) {
    return z.object({
        ticketTypeId: zRequiredTrimmedString(t('programsControl.ticketTypeRequired')),
        name: zRequiredTrimmedString(t('programsControl.passengerNameRequired')),
        email: z
            .string()
            .trim()
            .min(1, t('publicBooking.contactEmailRequired'))
            .email(t('publicBooking.contactEmailInvalid'))
            .max(255),
        country: z
            .string()
            .trim()
            .min(1, t('publicBooking.countryRequired'))
            .length(2, t('publicBooking.countryRequired'))
            .regex(/^[A-Za-z]{2}$/, t('publicBooking.countryRequired'))
            .transform((value) => value.toUpperCase()),
    });
}

export type BookingTicketRowValues = z.infer<
    ReturnType<typeof createBookingTicketRowZodSchema>
>;
