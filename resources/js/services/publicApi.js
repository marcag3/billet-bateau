import { buildJsonHeaders } from './http.client';

/**
 * @param {string} path  Relative path starting with /api/...
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<unknown>}
 */
export function fetchPublicJson(path, options = {}) {
    if (path.startsWith('/api/') !== true) {
        return Promise.reject(new Error('[publicApi] path must be under /api/'));
    }

    return fetch(path, {
        method: 'GET',
        credentials: 'same-origin',
        headers: buildJsonHeaders(
            { Accept: 'application/json' },
            { includeRequestedWith: true },
        ),
        signal: options.signal,
    }).then(async (response) => {
        if (!response.ok) {
            const err = new Error(`HTTP ${response.status}`);
            err.cause = response;
            throw err;
        }
        return response.json();
    });
}
