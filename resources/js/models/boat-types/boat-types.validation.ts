import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { boatEntityNameSchema, type Translator } from '../boats/boats.validation';

function createBoatTypeZodSchema(t: Translator) {
    return z.object({
        name: boatEntityNameSchema(t),
    });
}

export type BoatTypeFormValues = z.infer<ReturnType<typeof createBoatTypeZodSchema>>;

export function createEmptyBoatTypeFormValues(): BoatTypeFormValues {
    return { name: '' };
}

/**
 * Boat type create form (single field today; name matches row shape).
 */
export function createBoatTypeFormSchema(t: Translator) {
    return toTypedSchema(createBoatTypeZodSchema(t));
}
