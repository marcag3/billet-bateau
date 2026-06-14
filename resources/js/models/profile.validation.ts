import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import {
    zRequiredPassword,
    zRequiredTrimmedString,
    zTrimmedEmail,
} from '../validation/zod-fields';

export type Translator = (key: string) => string;

function createProfileZodSchema(t: Translator) {
    return z.object({
        name: zRequiredTrimmedString(t('profile.validationRequired')),
        email: zTrimmedEmail(
            t('profile.validationRequired'),
            t('profile.validationEmail'),
        ),
    });
}

export type ProfileFormValues = z.infer<ReturnType<typeof createProfileZodSchema>>;

export function createProfileFormSchema(t: Translator) {
    return toTypedSchema(createProfileZodSchema(t));
}

function createChangePasswordZodSchema(t: Translator) {
    return z
        .object({
            currentPassword: zRequiredPassword(t('profile.validationRequired')),
            password: zRequiredPassword(t('profile.validationRequired')),
            passwordConfirmation: zRequiredPassword(t('profile.validationRequired')),
        })
        .refine((data) => data.password === data.passwordConfirmation, {
            message: t('profile.passwordMismatch'),
            path: ['passwordConfirmation'],
        });
}

export type ChangePasswordFormValues = z.infer<
    ReturnType<typeof createChangePasswordZodSchema>
>;

export function createChangePasswordFormSchema(t: Translator) {
    return toTypedSchema(createChangePasswordZodSchema(t));
}
