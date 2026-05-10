import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { parsePositiveInt } from '../../validation/zod-fields';
import { boatEntityNameSchema, type Translator } from '../boats/boats.validation';

function createWaterRouteFormZodSchema(t: Translator) {
    return z.object({
        name: boatEntityNameSchema(t),
        durationMinutes: z
            .preprocess((v) => parsePositiveInt(v), z.union([z.number().int().min(1), z.null()]))
            .refine((v): v is number => v !== null, { message: t('waterRoutesList.durationRequired') }),
        traceGeoJson: z.string().optional(),
    });
}

export type WaterRouteFormValues = z.infer<ReturnType<typeof createWaterRouteFormZodSchema>>;

export function createEmptyWaterRouteFormValues(): WaterRouteFormValues {
    return {
        name: '',
        durationMinutes: 60,
        traceGeoJson: '',
    };
}

export function createWaterRouteFormSchema(t: Translator) {
    return toTypedSchema(createWaterRouteFormZodSchema(t));
}
