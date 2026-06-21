import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { zRequiredTrimmedString } from '../../validation/zod-fields';

export type Translator = (key: string) => string;

export function createVoyageAdminFormZodSchema(t: Translator) {
    return z.object({
        tripId: zRequiredTrimmedString(t('programsControlAdmin.tripRequired')),
        waterRouteId: zRequiredTrimmedString(t('programsControlAdmin.waterRouteRequired')),
        scheduledDepartureAt: z.string().nullable(),
        startedAt: z.string().nullable(),
        arrivedAt: z.string().nullable(),
        boatIds: z.array(z.string()),
        guideIds: z.array(z.string()),
    });
}

export type VoyageAdminFormValues = z.infer<
    ReturnType<typeof createVoyageAdminFormZodSchema>
>;

export function createVoyageAdminFormSchema(t: Translator) {
    return toTypedSchema(createVoyageAdminFormZodSchema(t));
}
