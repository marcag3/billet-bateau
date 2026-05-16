import { isValid } from 'ulid';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { composeLocalDatetimeFromParts } from '../../utilities/datetime-input';
import {
    isValidCalendarDateYmd,
    isValidTimeHm,
} from '../../utilities/trip-departure-query';

export type Translator = (key: string) => string;

const requiredUlidRefSchema = z.preprocess(
    (v) => (v == null || v === '' ? '' : String(v)),
    z.string().refine((s) => isValid(s)),
);

function buildTripUpsertZodSchema(t: Translator) {
    return z
        .object({
            scheduledDepartureDate: z
                .string()
                .trim()
                .min(1, t('tripsList.scheduledDepartureDateRequired'))
                .refine((s) => isValidCalendarDateYmd(s), t('tripsList.scheduledDepartureInvalid')),
            scheduledDepartureTime: z
                .string()
                .trim()
                .min(1, t('tripsList.scheduledDepartureTimeRequired'))
                .refine((s) => isValidTimeHm(s), t('tripsList.scheduledDepartureInvalid')),
            productId: requiredUlidRefSchema.refine((s) => s.length > 0, {
                message: t('tripsList.productRequired'),
            }),
        })
        .superRefine((data, ctx) => {
            const composed = composeLocalDatetimeFromParts(
                data.scheduledDepartureDate,
                data.scheduledDepartureTime,
            );
            if (Number.isNaN(Date.parse(composed))) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: t('tripsList.scheduledDepartureInvalid'),
                    path: ['scheduledDepartureTime'],
                });
            }
        });
}

export type TripUpsertFormValues = z.infer<ReturnType<typeof buildTripUpsertZodSchema>>;

/** Exposed for unit tests (same shape as the vee-validate schema). */
export function buildTripUpsertZodSchemaForTests(t: Translator) {
    return buildTripUpsertZodSchema(t);
}

export function createTripUpsertFormSchema(t: Translator) {
    return toTypedSchema(buildTripUpsertZodSchema(t));
}
