import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { createWalkInBookingContactZodSchema } from '../public-booking/public-booking.validation';
import {
    zOptionalTrimmedEmail,
    zOptionalTrimmedPhone,
    zRequiredTrimmedString,
} from '../../validation/zod-fields';

export type Translator = (key: string) => string;

export function createBookingAdminFormZodSchema(t: Translator) {
    return createWalkInBookingContactZodSchema(t).extend({
        tripId: zRequiredTrimmedString(t('programsControlAdmin.tripRequired')),
    });
}

export type BookingAdminFormValues = z.infer<
    ReturnType<typeof createBookingAdminFormZodSchema>
>;

export function createBookingAdminFormSchema(t: Translator) {
    return toTypedSchema(createBookingAdminFormZodSchema(t));
}

export function createBookingEditFormZodSchema(t: Translator) {
    return z.object({
        tripId: zRequiredTrimmedString(t('programsControlAdmin.tripRequired')),
        contact_name: zRequiredTrimmedString(t('publicBooking.contactNameRequired')),
        contact_email: z.preprocess(
            (value) => (value == null ? '' : value),
            zOptionalTrimmedEmail(t('publicBooking.contactEmailInvalid')),
        ),
        contact_phone: z.preprocess(
            (value) => (value == null ? '' : value),
            zOptionalTrimmedPhone(t('publicBooking.contactPhoneInvalid')),
        ),
    });
}

export type BookingEditFormValues = z.infer<
    ReturnType<typeof createBookingEditFormZodSchema>
>;

export function createBookingEditFormSchema(t: Translator) {
    return toTypedSchema(createBookingEditFormZodSchema(t));
}

export function createBookingTicketRowZodSchema(t: Translator) {
    return z.object({
        ticketTypeId: zRequiredTrimmedString(t('programsControl.ticketTypeRequired')),
        name: zRequiredTrimmedString(t('programsControl.passengerNameRequired')),
        email: z
            .string()
            .trim()
            .min(1, t('publicBooking.contactEmailRequired'))
            .max(255)
            .pipe(z.email(t('publicBooking.contactEmailInvalid'))),
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
