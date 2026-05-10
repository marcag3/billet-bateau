import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import {
    coerceStringInput,
    zHexColorSix,
    zLowercaseSlug,
    zRequiredTrimmedString,
} from '../../validation/zod-fields';
import { normalizeThemeColor } from '../../utilities/program-helpers';
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
    line_1: z.preprocess(coerceStringInput, z.string().trim()),
    line_2: z.preprocess(coerceStringInput, z.string().trim()),
    city: z.preprocess(coerceStringInput, z.string().trim()),
    postal_code: z.preprocess(coerceStringInput, z.string().trim()),
    country: z.preprocess(coerceStringInput, z.string().trim()),
});

function createProgramCreateZodSchema(t: Translator) {
    return z.object({
        name: zRequiredTrimmedString(t('programsCreate.validationRequired')),
        description: z.string(),
        themeColor: zHexColorSix(t('programsCreate.validationHex')),
        isActive: z.boolean(),
        address: programAddressObjectSchema,
    });
}

export type ProgramCreateFormValues = z.infer<ReturnType<typeof createProgramCreateZodSchema>>;

/**
 * Program create form — shapes align with createProgramWithOptionalAddress and address models.
 */
export function createProgramCreateFormSchema(t: Translator) {
    return toTypedSchema(createProgramCreateZodSchema(t));
}

export function createProgramEditZodSchema(t: Translator) {
    return z.object({
        name: zRequiredTrimmedString(t('programsCreate.validationRequired')),
        description: z.preprocess(coerceStringInput, z.string().trim()),
        themeColor: z.preprocess(
            coerceStringInput,
            zHexColorSix(t('programsCreate.validationHex')).transform((hex) =>
                normalizeThemeColor(hex),
            ),
        ),
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
    });
}

export type ProgramEditFormValues = z.infer<ReturnType<typeof createProgramEditZodSchema>>;

/**
 * Program edit form — aligns with updateProgramWithOptionalAddress.
 */
export function createProgramEditFormSchema(t: Translator) {
    return toTypedSchema(createProgramEditZodSchema(t));
}
