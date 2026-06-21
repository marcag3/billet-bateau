import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import {
    coerceStringInput,
    zHexColorSix,
    zLowercaseSlug,
    zRequiredTrimmedString,
} from '../../validation/zod-fields';
import { defaultProgramDateRange, normalizeThemeColor } from '../../utilities/program-helpers';
import { foldUnicodeForProgramSlug } from '../../utilities/program-slug';
import { DEFAULT_PROGRAM_TIMEZONE, isSupportedTimezone } from '../../composables/useTimezoneOptions';

export type Translator = (key: string) => string;

const isoYmd = (t: Translator) =>
    z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, t('programsCreate.validationDateYmd'));

const programTimezone = (t: Translator) =>
    z
        .string()
        .min(1, t('programsCreate.validationRequired'))
        .refine((value) => isSupportedTimezone(value), t('programsCreate.validationTimezone'));

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

function withProgramDateOrder<T extends z.ZodRawShape>(t: Translator, base: z.ZodObject<T>) {
    return base.superRefine((data, ctx) => {
        const rec = data as { startDate?: string; endDate?: string };
        const start = rec.startDate;
        const end = rec.endDate;
        if (
            typeof start === 'string' &&
            typeof end === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(start) &&
            /^\d{4}-\d{2}-\d{2}$/.test(end) &&
            end < start
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('programsCreate.validationEndBeforeStart'),
                path: ['endDate'],
            });
        }
    });
}

function createProgramCreateZodSchema(t: Translator) {
    return withProgramDateOrder(
        t,
        z.object({
            name: zRequiredTrimmedString(t('programsCreate.validationRequired')),
            description: z.string(),
            themeColor: zHexColorSix(t('programsCreate.validationHex')),
            isActive: z.boolean(),
            startDate: isoYmd(t),
            endDate: isoYmd(t),
            timezone: programTimezone(t),
            bookingQuestionsText: z.preprocess(coerceStringInput, z.string()),
            emailSignature: z.preprocess(coerceStringInput, z.string().trim().max(1000)),
            address: programAddressObjectSchema,
        }),
    );
}

export type ProgramCreateFormValues = z.infer<ReturnType<typeof createProgramCreateZodSchema>>;

export function createEmptyProgramCreateFormValues(): ProgramCreateFormValues {
    const range = defaultProgramDateRange();
    return {
        name: '',
        description: '',
        themeColor: '#08758A',
        isActive: true,
        startDate: range.startDate,
        endDate: range.endDate,
        timezone: DEFAULT_PROGRAM_TIMEZONE,
        bookingQuestionsText: '',
        emailSignature: '',
        address: {
            line_1: '',
            line_2: '',
            city: '',
            postal_code: '',
            country: '',
        },
    };
}

/**
 * Program create form — shapes align with createProgramWithOptionalAddress and address models.
 */
export function createProgramCreateFormSchema(t: Translator) {
    return toTypedSchema(createProgramCreateZodSchema(t));
}

export function createProgramEditZodSchema(t: Translator) {
    return withProgramDateOrder(
        t,
        z.object({
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
            startDate: isoYmd(t),
            endDate: isoYmd(t),
            timezone: programTimezone(t),
            bookingQuestionsText: z.preprocess(coerceStringInput, z.string()),
            emailSignature: z.preprocess(coerceStringInput, z.string().trim().max(1000)),
            address: programAddressObjectSchema,
        }),
    );
}

export type ProgramEditFormValues = z.infer<ReturnType<typeof createProgramEditZodSchema>>;

export function createEmptyProgramEditFormValues(): ProgramEditFormValues {
    return {
        ...createEmptyProgramCreateFormValues(),
        slug: '',
        startDate: '',
        endDate: '',
    };
}

/**
 * Program edit form — aligns with updateProgramWithOptionalAddress.
 */
export function createProgramEditFormSchema(t: Translator) {
    return toTypedSchema(createProgramEditZodSchema(t));
}
