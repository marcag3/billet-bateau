import { z } from 'zod';

/**
 * Normalize unknown UI/input values to string before Zod parsing.
 */
export function coerceStringInput(raw: unknown): string {
    return typeof raw === 'string' ? raw : String(raw ?? '');
}

/**
 * Parse optional non-negative integers from form controls (empty → null, invalid → null).
 * Accepts numbers or digit strings; rejects negatives and non-finite values.
 */
export function parseOptionalNonNegativeInt(raw: unknown): number | null {
    if (raw === null || raw === undefined || raw === '') {
        return null;
    }
    const n = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
    if (!Number.isFinite(n) || n < 0) {
        return null;
    }
    return n;
}

/**
 * Parse required positive integers (empty / non-finite / below 1 → null).
 */
export function parsePositiveInt(raw: unknown): number | null {
    if (raw === null || raw === undefined || raw === '') {
        return null;
    }
    const n = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
    if (!Number.isFinite(n) || n < 1) {
        return null;
    }
    return n;
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
