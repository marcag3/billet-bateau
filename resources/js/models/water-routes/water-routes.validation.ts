import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { parsePositiveInt } from '../../validation/zod-fields';
import { boatEntityNameSchema, type Translator } from '../boats/boats.validation';

function createWaterRouteCreateZodSchema(t: Translator) {
    return z.object({
        name: boatEntityNameSchema(t),
        durationMinutes: z
            .preprocess((v) => parsePositiveInt(v), z.union([z.number().int().min(1), z.null()]))
            .refine((v): v is number => v !== null, { message: t('waterRoutesList.durationRequired') }),
        traceGeoJson: z.string().optional(),
    });
}

export type WaterRouteCreateFormValues = z.infer<ReturnType<typeof createWaterRouteCreateZodSchema>>;

export function createWaterRouteCreateFormSchema(t: Translator) {
    return toTypedSchema(createWaterRouteCreateZodSchema(t));
}
