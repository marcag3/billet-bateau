import {
    buildJsonHeaders,
    fetchWith419Retry,
    getCsrfHeaders,
    parseJsonPayload,
} from './http.client';

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

export type PublicApiErrorPayload = {
    message?: string;
    errors?: Record<string, string[]>;
};

export class PublicApiRequestError extends Error {
    readonly status: number;

    readonly payload: PublicApiErrorPayload;

    constructor(message: string, status: number, payload: PublicApiErrorPayload) {
        super(message);
        this.name = 'PublicApiRequestError';
        this.status = status;
        this.payload = payload;
    }
}

export function formatPublicApiErrorMessage(payload: PublicApiErrorPayload): string {
    const errors = payload.errors;
    if (errors != null && typeof errors === 'object') {
        for (const msgs of Object.values(errors)) {
            if (Array.isArray(msgs) && msgs.length > 0 && typeof msgs[0] === 'string') {
                return msgs[0];
            }
        }
    }
    if (typeof payload.message === 'string' && payload.message.length > 0) {
        return payload.message;
    }
    return '';
}

export async function postPublicJson(
    path: string,
    body: unknown,
    options: { signal?: AbortSignal } = {},
): Promise<unknown> {
    if (path.startsWith('/api/') !== true) {
        return Promise.reject(new Error('[publicApi] path must be under /api/'));
    }

    const response = await fetchWith419Retry(path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildJsonHeaders(
            {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...getCsrfHeaders(),
            },
            { includeRequestedWith: true },
        ),
        body: JSON.stringify(body),
        signal: options.signal,
    });

    const json = (await parseJsonPayload(response)) as PublicApiErrorPayload & Record<string, unknown>;

    if (!response.ok) {
        const detail = formatPublicApiErrorMessage(json);
        const message =
            detail.length > 0 ? detail : `HTTP ${String(response.status)}`;
        throw new PublicApiRequestError(message, response.status, json);
    }

    return json;
}

