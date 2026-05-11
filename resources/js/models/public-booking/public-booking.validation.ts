import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { zRequiredTrimmedString } from '../../validation/zod-fields';

export type Translator = (key: string) => string;

function createPublicBookingContactZodSchema(t: Translator) {
    return z.object({
        contact_name: zRequiredTrimmedString(t('publicBooking.contactNameRequired')),
        contact_email: z
            .string()
            .trim()
            .min(1, t('publicBooking.contactEmailRequired'))
            .email(t('publicBooking.contactEmailInvalid'))
            .max(255),
    });
}

export type PublicBookingContactFormValues = z.infer<
    ReturnType<typeof createPublicBookingContactZodSchema>
>;

export function createPublicBookingContactFormSchema(t: Translator) {
    return toTypedSchema(createPublicBookingContactZodSchema(t));
}
