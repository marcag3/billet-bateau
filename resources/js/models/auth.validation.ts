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

function createForgotPasswordZodSchema(t: Translator) {
    return z.object({
        email: zTrimmedEmail(t('auth.validationRequired'), t('auth.validationEmail')),
    });
}

export type ForgotPasswordFormValues = z.infer<ReturnType<typeof createForgotPasswordZodSchema>>;

export function createForgotPasswordFormSchema(t: Translator) {
    return toTypedSchema(createForgotPasswordZodSchema(t));
}

function createResetPasswordZodSchema(t: Translator) {
    return z
        .object({
            password: zRequiredPassword(t('auth.validationRequired')),
            passwordConfirmation: zRequiredPassword(t('auth.validationRequired')),
        })
        .refine((data) => data.password === data.passwordConfirmation, {
            message: t('auth.resetPassword.passwordMismatch'),
            path: ['passwordConfirmation'],
        });
}

export type ResetPasswordFormValues = z.infer<ReturnType<typeof createResetPasswordZodSchema>>;

export function createResetPasswordFormSchema(t: Translator) {
    return toTypedSchema(createResetPasswordZodSchema(t));
}
