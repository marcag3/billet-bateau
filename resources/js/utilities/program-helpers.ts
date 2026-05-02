import { foldUnicodeForProgramSlug } from './program-slug';

/**
 * @param {Record<string, string | undefined | null>} address
 * @returns {boolean}
 */
export function addressHasAny(address: Record<string, string | undefined | null>): boolean {
    return ['line_1', 'line_2', 'city', 'postal_code', 'country'].some((key) => {
        const value = address[key];
        return typeof value === 'string' && value.trim().length > 0;
    });
}

/**
 * @param {unknown} hex
 * @returns {string}
 */
export function normalizeThemeColor(hex: unknown): string {
    const trimmed = String(hex ?? '').trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
        return trimmed.slice(0, 1) + trimmed.slice(1).toUpperCase();
    }
    return '#000000';
}

/**
 * @param {string} name
 * @param {string} id
 * @returns {string}
 */
export function buildInitialProgramSlug(name: string, id: string): string {
    const t = foldUnicodeForProgramSlug(name).toLowerCase();
    const kebab = t
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    if (kebab.length > 0) {
        return kebab.length > 200 ? kebab.slice(0, 200) : kebab;
    }
    const h = id.replace(/-/g, '');
    return `p-${h.slice(0, 8)}`.toLowerCase();
}

/**
 * @param {Record<string, string | undefined | null>} address
 * @returns {Record<string, string | null>}
 */
export function normalizeAddressRowFields(
    address: Record<string, string | undefined | null>,
): Record<string, string | null> {
    if (!addressHasAny(address)) {
        return {
            line_1: null,
            line_2: null,
            city: null,
            postal_code: null,
            country: null,
        };
    }
    return {
        line_1: typeof address.line_1 === 'string' ? address.line_1.trim() || null : null,
        line_2: typeof address.line_2 === 'string' ? address.line_2.trim() || null : null,
        city: typeof address.city === 'string' ? address.city.trim() || null : null,
        postal_code: typeof address.postal_code === 'string' ? address.postal_code.trim() || null : null,
        country: typeof address.country === 'string' ? address.country.trim() || null : null,
    };
}
