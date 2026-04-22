/**
 * Recursively replace bigint with number when safe, otherwise string.
 * Keeps Date instances and non-plain objects untouched.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
export function stripBigIntsDeep(value) {
    if (typeof value === 'bigint') {
        const asNumber = Number(value);

        return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
    }

    if (value === null || value === undefined) {
        return value;
    }

    if (value instanceof Date) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(stripBigIntsDeep);
    }

    if (typeof value === 'object') {
        const proto = Object.getPrototypeOf(value);

        if (proto !== null && proto !== Object.prototype) {
            return value;
        }

        const out = {};

        for (const key of Object.keys(value)) {
            out[key] = stripBigIntsDeep(/** @type {Record<string, unknown>} */ (value)[key]);
        }

        return out;
    }

    return value;
}

/**
 * @param {unknown} message
 * @returns {unknown}
 */
function normalizeChangeMessageForJsonSafeRow(message) {
    if (!message || typeof message !== 'object') {
        return message;
    }

    const m = /** @type {Record<string, unknown>} */ (message);
    const next = { ...m };

    if ('key' in next && typeof next.key === 'bigint') {
        next.key = next.key.toString();
    }

    if ('value' in next && next.value !== null && typeof next.value === 'object') {
        next.value = stripBigIntsDeep(next.value);
    }

    if ('previousValue' in next && next.previousValue !== null && typeof next.previousValue === 'object') {
        next.previousValue = stripBigIntsDeep(next.previousValue);
    }

    if ('metadata' in next && next.metadata !== null && typeof next.metadata === 'object') {
        next.metadata = stripBigIntsDeep(next.metadata);
    }

    return next;
}

/**
 * Wrap sync.write so every row applied from Electric / SQLite hydration is JSON-serializable.
 * Matches the idea of a single global default (see TanStack Query discussion on consistent defaults).
 *
 * @template T
 * @param {T} collectionOptions
 * @returns {T}
 */
export function wrapCollectionSyncWritesForJsonSafeRows(collectionOptions) {
    const sync = /** @type {{ sync?: unknown }} */ (collectionOptions).sync;

    if (!sync || typeof sync !== 'object' || typeof sync.sync !== 'function') {
        return collectionOptions;
    }

    const innerSync = sync.sync;

    return {
        ...collectionOptions,
        sync: {
            ...sync,
            sync: (params) => {
                const write = params?.write;

                if (typeof write !== 'function') {
                    return innerSync(params);
                }

                return innerSync({
                    ...params,
                    write: (message) => write(normalizeChangeMessageForJsonSafeRow(message)),
                });
            },
        },
    };
}
