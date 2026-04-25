import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import {
    coerceStringInput,
    zHexColorSix,
    zLowercaseSlug,
    zRequiredTrimmedString,
} from '../../validation/zod-fields.js';

/**
 * Program list slug field (list UI) — trim, require, lowercase.
 *
 * @param {(key: string) => string} t
 */
export function programSlugSchema(t) {
    return zLowercaseSlug(t('programsList.slugRequired'));
}

/**
 * @param {(key: string) => string} t
 * @param {unknown} raw
 */
export function safeParseProgramSlug(t, raw) {
    return programSlugSchema(t).safeParse(coerceStringInput(raw));
}

const programAddressObjectSchema = z.object({
    line_1: z.string(),
    line_2: z.string(),
    city: z.string(),
    postal_code: z.string(),
    country: z.string(),
});

const imagesFieldSchema = z.union([z.array(z.instanceof(File)), z.null()]);

/**
 * Program create form — shapes align with
 * {@link import('./programs.model.js').createProgramWithOptionalAddress} and address keys
 * in {@link import('../addresses/addresses.model.js')}.
 *
 * @param {(key: string) => string} t
 */
export function createProgramCreateFormSchema(t) {
    return toTypedSchema(
        z.object({
            name: zRequiredTrimmedString(t('programsCreate.validationRequired')),
            description: z.string(),
            themeColor: zHexColorSix(t('programsCreate.validationHex')),
            address: programAddressObjectSchema,
            imagesModel: imagesFieldSchema,
        }),
    );
}
