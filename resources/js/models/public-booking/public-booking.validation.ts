import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { zOptionalTrimmedEmail, zOptionalTrimmedPhone, zRequiredTrimmedString } from '../../validation/zod-fields';

export type Translator = (key: string) => string;

export function createPublicBookingContactZodSchema(t: Translator) {
    return z.object({
        contact_name: zRequiredTrimmedString(t('publicBooking.contactNameRequired')),
        contact_email: z
            .string()
            .trim()
            .min(1, t('publicBooking.contactEmailRequired'))
            .max(255)
            .pipe(z.email(t('publicBooking.contactEmailInvalid'))),
        contact_phone: z.preprocess(
            (value) => (value == null ? '' : value),
            zOptionalTrimmedPhone(t('publicBooking.contactPhoneInvalid')),
        ),
        country: z
            .string()
            .trim()
            .min(1, t('publicBooking.countryRequired'))
            .length(2, t('publicBooking.countryRequired'))
            .regex(/^[A-Za-z]{2}$/, t('publicBooking.countryRequired'))
            .transform((value) => value.toUpperCase()),
    });
}

export type PublicBookingContactFormValues = z.infer<
    ReturnType<typeof createPublicBookingContactZodSchema>
>;

export function createPublicBookingContactFormSchema(t: Translator) {
    return toTypedSchema(createPublicBookingContactZodSchema(t));
}

export function createWalkInBookingContactZodSchema(t: Translator) {
    return z.object({
        contact_name: zRequiredTrimmedString(t('publicBooking.contactNameRequired')),
        contact_email: zOptionalTrimmedEmail(t('publicBooking.contactEmailInvalid')),
        contact_phone: z.preprocess(
            (value) => (value == null ? '' : value),
            zOptionalTrimmedPhone(t('publicBooking.contactPhoneInvalid')),
        ),
        country: z
            .string()
            .trim()
            .min(1, t('publicBooking.countryRequired'))
            .length(2, t('publicBooking.countryRequired'))
            .regex(/^[A-Za-z]{2}$/, t('publicBooking.countryRequired'))
            .transform((value) => value.toUpperCase()),
    });
}

export type WalkInBookingContactFormValues = z.infer<
    ReturnType<typeof createWalkInBookingContactZodSchema>
>;

export function createWalkInBookingContactFormSchema(t: Translator) {
    return toTypedSchema(createWalkInBookingContactZodSchema(t));
}
