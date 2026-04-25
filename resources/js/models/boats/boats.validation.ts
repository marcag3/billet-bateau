import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { parseOptionalCapacity } from './boats.model.js';
import { coerceStringInput, zRequiredTrimmedString } from '../../validation/zod-fields';

export type Translator = (key: string) => string;

/**
 * Boat or boat-type name field — trim + required (shared i18n key with boat-types form).
 */
export function boatEntityNameSchema(t: Translator) {
    return zRequiredTrimmedString(t('boatsList.nameRequired'));
}

export function safeParseBoatEntityName(t: Translator, raw: unknown) {
    return boatEntityNameSchema(t).safeParse(coerceStringInput(raw));
}

const boatTypeIdValueSchema = z.preprocess(
    (v) => (v == null || v === '' ? null : String(v)),
    z.union([z.string().min(1), z.null()]),
);

function createBoatCreateZodSchema(t: Translator) {
    return z.object({
        name: boatEntityNameSchema(t),
        capacity: z.preprocess(
            (v) => parseOptionalCapacity(v),
            z.union([z.number().int().min(0), z.null()]),
        ),
        notes: z.string(),
        boatTypeId: boatTypeIdValueSchema,
    });
}

export type BoatCreateFormValues = z.infer<ReturnType<typeof createBoatCreateZodSchema>>;

/**
 * Create-boat form — same payload shape as createBoatRow.
 */
export function createBoatCreateFormSchema(t: Translator) {
    return toTypedSchema(createBoatCreateZodSchema(t));
}
