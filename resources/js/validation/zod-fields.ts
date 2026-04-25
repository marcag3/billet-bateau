import { z } from 'zod';

/**
 * Normalize unknown UI/input values to string before Zod parsing.
 */
export function coerceStringInput(raw: unknown): string {
    return typeof raw === 'string' ? raw : String(raw ?? '');
}

/**
 * Required non-empty string after trim.
 */
export function zRequiredTrimmedString(requiredMessage: string): z.ZodString {
    return z.string().trim().min(1, requiredMessage);
}

/**
 * Required trimmed string, lowercased for persistence (e.g. URL slugs).
 */
export function zLowercaseSlug(requiredMessage: string) {
    return zRequiredTrimmedString(requiredMessage).transform((s) => s.toLowerCase());
}

/**
 * Hex color #RRGGBB (Quasar q-color format-model hex).
 */
export function zHexColorSix(invalidMessage: string): z.ZodString {
    return z.string().regex(/^#[0-9A-Fa-f]{6}$/, invalidMessage);
}

/**
 * Trimmed email for auth-style forms.
 */
export function zTrimmedEmail(requiredMessage: string, emailMessage: string): z.ZodString {
    return z.string().trim().min(1, requiredMessage).email(emailMessage);
}

/**
 * Non-empty password (intentionally not trimmed).
 */
export function zRequiredPassword(requiredMessage: string): z.ZodString {
    return z.string().min(1, requiredMessage);
}
