import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import {
    zRequiredPassword,
    zRequiredTrimmedString,
    zTrimmedEmail,
} from '../validation/zod-fields.js';

/**
 * @param {(key: string) => string} t
 */
export function createLoginFormSchema(t) {
    return toTypedSchema(
        z.object({
            email: zTrimmedEmail(t('auth.validationRequired'), t('auth.validationEmail')),
            password: zRequiredPassword(t('auth.validationRequired')),
        }),
    );
}

/**
 * @param {(key: string) => string} t
 */
export function createSetupFormSchema(t) {
    return toTypedSchema(
        z
            .object({
                organizationName: zRequiredTrimmedString(t('setup.validationRequired')),
                email: zTrimmedEmail(t('setup.validationRequired'), t('auth.validationEmail')),
                password: zRequiredPassword(t('setup.validationRequired')),
                passwordConfirmation: zRequiredPassword(t('setup.validationRequired')),
            })
            .refine((data) => data.password === data.passwordConfirmation, {
                message: t('setup.passwordMismatch'),
                path: ['passwordConfirmation'],
            }),
    );
}
