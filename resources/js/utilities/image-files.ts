/**
 * Normalizes q-file v-model to a File[].
 * @param {File | File[] | null | undefined} value
 * @returns {File[]}
 */
export function normalizeImageFiles(value) {
    if (value == null) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.filter((f) => f instanceof File);
    }
    return value instanceof File ? [value] : [];
}
