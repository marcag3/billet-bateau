import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { parseOptionalCapacity } from './boats.model.js';
import { coerceStringInput, zRequiredTrimmedString } from '../../validation/zod-fields.js';

/**
 * Boat or boat-type name field — trim + required (shared i18n key with boat-types form).
 *
 * @param {(key: string) => string} t
 */
export function boatEntityNameSchema(t) {
    return zRequiredTrimmedString(t('boatsList.nameRequired'));
}

/**
 * @param {(key: string) => string} t
 * @param {unknown} raw
 */
export function safeParseBoatEntityName(t, raw) {
    return boatEntityNameSchema(t).safeParse(coerceStringInput(raw));
}

const boatTypeIdValueSchema = z.preprocess(
    (v) => (v == null || v === '' ? null : String(v)),
    z.union([z.string().min(1), z.null()]),
);

/**
 * Create-boat form — same payload shape as {@link import('./boats.model.js').createBoatRow}.
 *
 * @param {(key: string) => string} t
 */
export function createBoatCreateFormSchema(t) {
    return toTypedSchema(
        z.object({
            name: boatEntityNameSchema(t),
            capacity: z.preprocess(
                (v) => parseOptionalCapacity(v),
                z.union([z.number().int().min(0), z.null()]),
            ),
            notes: z.string(),
            boatTypeId: boatTypeIdValueSchema,
        }),
    );
}
