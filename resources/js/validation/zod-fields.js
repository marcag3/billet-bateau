import { z } from 'zod';

/**
 * Normalize unknown UI/input values to string before Zod parsing.
 *
 * @param {unknown} raw
 * @returns {string}
 */
export function coerceStringInput(raw) {
    return typeof raw === 'string' ? raw : String(raw ?? '');
}

/**
 * Required non-empty string after trim.
 *
 * @param {string} requiredMessage
 * @returns {z.ZodString}
 */
export function zRequiredTrimmedString(requiredMessage) {
    return z.string().trim().min(1, requiredMessage);
}

/**
 * Required trimmed string, lowercased for persistence (e.g. URL slugs).
 *
 * @param {string} requiredMessage
 * @returns {z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>}
 */
export function zLowercaseSlug(requiredMessage) {
    return zRequiredTrimmedString(requiredMessage).transform((s) =>
        s.toLowerCase(),
    );
}

/**
 * Hex color #RRGGBB (Quasar q-color format-model hex).
 *
 * @param {string} invalidMessage
 * @returns {z.ZodString}
 */
export function zHexColorSix(invalidMessage) {
    return z.string().regex(/^#[0-9A-Fa-f]{6}$/, invalidMessage);
}

/**
 * Trimmed email for auth-style forms.
 *
 * @param {string} requiredMessage
 * @param {string} emailMessage
 * @returns {z.ZodString}
 */
export function zTrimmedEmail(requiredMessage, emailMessage) {
    return z.string().trim().min(1, requiredMessage).email(emailMessage);
}

/**
 * Non-empty password (intentionally not trimmed).
 *
 * @param {string} requiredMessage
 * @returns {z.ZodString}
 */
export function zRequiredPassword(requiredMessage) {
    return z.string().min(1, requiredMessage);
}

