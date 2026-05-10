import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { parsePositiveInt } from '../../validation/zod-fields';
import { isPersistableLineStringGeoJson } from '../../utilities/geojson-line-string';
import { boatEntityNameSchema, type Translator } from '../boats/boats.validation';

function createWaterRouteFormZodSchema(t: Translator) {
    return z.object({
        name: boatEntityNameSchema(t),
        durationMinutes: z
            .preprocess((v) => parsePositiveInt(v), z.union([z.number().int().min(1), z.null()]))
            .refine((v): v is number => v !== null, { message: t('waterRoutesList.durationRequired') }),
        traceGeoJson: z.string().refine(
            (v) => {
                const trimmed = v.trim();
                if (trimmed.length === 0) {
                    return true;
                }
                return isPersistableLineStringGeoJson(trimmed);
            },
            { message: t('waterRoutesList.invalidGeoJson') },
        ),
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
