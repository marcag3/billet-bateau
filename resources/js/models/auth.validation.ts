import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import {
    zRequiredPassword,
    zRequiredTrimmedString,
    zTrimmedEmail,
} from '../validation/zod-fields';

export type Translator = (key: string) => string;

function createLoginZodSchema(t: Translator) {
    return z.object({
        email: zTrimmedEmail(t('auth.validationRequired'), t('auth.validationEmail')),
        password: zRequiredPassword(t('auth.validationRequired')),
    });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginZodSchema>>;

export function createLoginFormSchema(t: Translator) {
    return toTypedSchema(createLoginZodSchema(t));
}

function createSetupZodSchema(t: Translator) {
    return z
        .object({
            organizationName: zRequiredTrimmedString(t('setup.validationRequired')),
            email: zTrimmedEmail(t('setup.validationRequired'), t('auth.validationEmail')),
            password: zRequiredPassword(t('setup.validationRequired')),
            passwordConfirmation: zRequiredPassword(t('setup.validationRequired')),
        })
        .refine((data) => data.password === data.passwordConfirmation, {
            message: t('setup.passwordMismatch'),
            path: ['passwordConfirmation'],
        });
}

export type SetupFormValues = z.infer<ReturnType<typeof createSetupZodSchema>>;

export function createSetupFormSchema(t: Translator) {
    return toTypedSchema(createSetupZodSchema(t));
}
