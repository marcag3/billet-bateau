import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import {
    coerceStringInput,
    zHexColorSix,
    zLowercaseSlug,
    zRequiredTrimmedString,
} from '../../validation/zod-fields';
import { foldUnicodeForProgramSlug } from '../../utilities/program-slug';

export type Translator = (key: string) => string;

/**
 * Program list slug field (list UI) — trim, require, lowercase.
 */
export function programSlugSchema(t: Translator) {
    return zLowercaseSlug(t('programsList.slugRequired'));
}

export function safeParseProgramSlug(t: Translator, raw: unknown) {
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

function createProgramCreateZodSchema(t: Translator) {
    return z.object({
        name: zRequiredTrimmedString(t('programsCreate.validationRequired')),
        description: z.string(),
        themeColor: zHexColorSix(t('programsCreate.validationHex')),
        isActive: z.boolean(),
        address: programAddressObjectSchema,
        imagesModel: imagesFieldSchema,
    });
}

export type ProgramCreateFormValues = z.infer<ReturnType<typeof createProgramCreateZodSchema>>;

/**
 * Program create form — shapes align with createProgramWithOptionalAddress and address models.
 */
export function createProgramCreateFormSchema(t: Translator) {
    return toTypedSchema(createProgramCreateZodSchema(t));
}

function createProgramEditZodSchema(t: Translator) {
    return z.object({
        name: zRequiredTrimmedString(t('programsCreate.validationRequired')),
        description: z.string(),
        themeColor: zHexColorSix(t('programsCreate.validationHex')),
        slug: z.preprocess((raw) => {
            const s = coerceStringInput(raw);
            const folded = foldUnicodeForProgramSlug(s).toLowerCase();
            return folded
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }, programSlugSchema(t)),
        isActive: z.boolean(),
        isArchived: z.boolean(),
        address: programAddressObjectSchema,
        imagesModel: imagesFieldSchema,
    });
}

export type ProgramEditFormValues = z.infer<ReturnType<typeof createProgramEditZodSchema>>;

/**
 * Program edit form — aligns with updateProgramWithOptionalAddress.
 */
export function createProgramEditFormSchema(t: Translator) {
    return toTypedSchema(createProgramEditZodSchema(t));
}
