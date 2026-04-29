/**
 * @param {object} address
 * @returns {boolean}
 */
export function addressHasAny(address) {
    return ['line_1', 'line_2', 'city', 'postal_code', 'country'].some((key) => {
        const value = address[key];
        return typeof value === 'string' && value.trim().length > 0;
    });
}

/**
 * @param {string} addressId
 * @param {string} programId
 * @param {Record<string, string | undefined>} address
 * @param {string} now
 * @returns {Record<string, unknown>}
 */
export function buildAddressInsertRow(addressId, programId, address, now) {
    return {
        id: addressId,
        program_id: programId,
        line_1: typeof address.line_1 === 'string' ? address.line_1.trim() || null : null,
        line_2: typeof address.line_2 === 'string' ? address.line_2.trim() || null : null,
        city: typeof address.city === 'string' ? address.city.trim() || null : null,
        postal_code: typeof address.postal_code === 'string' ? address.postal_code.trim() || null : null,
        country: typeof address.country === 'string' ? address.country.trim() || null : null,
        created_at: now,
        updated_at: now,
    };
}
