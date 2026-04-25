import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { boatEntityNameSchema } from '../boats/boats.validation.js';

/**
 * Boat type create form (single field today; name matches row shape).
 *
 * @param {(key: string) => string} t
 */
export function createBoatTypeFormSchema(t) {
    return toTypedSchema(
        z.object({
            name: boatEntityNameSchema(t),
        }),
    );
}
