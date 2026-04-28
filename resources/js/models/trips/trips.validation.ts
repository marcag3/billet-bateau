import { isValid } from 'ulid';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { parsePositiveInt } from '../../validation/zod-fields';

export type Translator = (key: string) => string;

const optionalUlidRefSchema = z.preprocess(
    (v) => (v == null || v === '' ? null : String(v)),
    z.union([z.string().refine((s) => isValid(s)), z.null()]),
);

function createTripUpsertZodSchema(t: Translator) {
    return z.object({
        scheduledDepartureAt: z
            .string()
            .trim()
            .min(1, t('tripsList.scheduledDepartureRequired'))
            .refine((s) => !Number.isNaN(Date.parse(s)), t('tripsList.scheduledDepartureInvalid')),
        capacity: z
            .preprocess(
                (v) => parsePositiveInt(v),
                z.union([z.number().int().min(1), z.null()]),
            )
            .refine((v): v is number => v !== null, { message: t('tripsList.capacityRequired') }),
        boatTypeId: optionalUlidRefSchema,
        waterRouteId: optionalUlidRefSchema,
    });
}

export type TripUpsertFormValues = z.infer<ReturnType<typeof createTripUpsertZodSchema>>;

export function createTripUpsertFormSchema(t: Translator) {
    return toTypedSchema(createTripUpsertZodSchema(t));
}
