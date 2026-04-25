import { buildJsonHeaders } from './http.client';

export function fetchPublicJson(
    path: string,
    options: { signal?: AbortSignal } = {},
): Promise<unknown> {
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
            throw new Error(`HTTP ${response.status}`, { cause: response });
        }
        return response.json();
    });
}
