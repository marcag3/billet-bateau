import { readCookieValue } from '../utilities/cookies';
import { APP_AUTH_EXPIRED_EVENT } from '../utilities/events';
import { csrfCookie } from '../routes/sanctum';

const API_HEADERS = {
    Accept: 'application/json',
};

type JsonRequestOptions = RequestInit & { withCsrf?: boolean };

let inflightCsrfRefreshPromise: Promise<boolean> | null = null;

function dispatchAuthExpiredEvent() {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(APP_AUTH_EXPIRED_EVENT));
}

function getCsrfTokenFromMeta() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function setCsrfTokenMeta(token: string) {
    if (!token) {
        return;
    }

    const existingMeta = document.querySelector('meta[name="csrf-token"]');
    if (existingMeta) {
        existingMeta.setAttribute('content', token);
        return;
    }

    const metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'csrf-token');
    metaTag.setAttribute('content', token);
    document.head.append(metaTag);
}

export function getCsrfHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const csrfToken = getCsrfTokenFromMeta();
    const xsrfToken = readCookieValue('XSRF-TOKEN');

    if (csrfToken.length > 0) {
        headers['X-CSRF-TOKEN'] = csrfToken;
    }

    if (xsrfToken.length > 0) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
    }

    return headers;
}

export function buildJsonHeaders(
    extraHeaders: Record<string, string> = {},
    { includeRequestedWith = false } = {},
) {
    return {
        ...API_HEADERS,
        ...(includeRequestedWith ? { 'X-Requested-With': 'XMLHttpRequest' } : {}),
        ...extraHeaders,
    };
}

async function refreshCsrfFromAppLayout() {
    const response = await fetch('/app', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'text/html',
            'Cache-Control': 'no-cache',
        },
    });

    if (!response.ok) {
        return false;
    }

    const appHtml = await response.text();
    const parsedDocument = new DOMParser().parseFromString(appHtml, 'text/html');
    const freshToken = parsedDocument.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

    if (freshToken.length === 0) {
        return false;
    }

    setCsrfTokenMeta(freshToken);
    return true;
}

export async function refreshCsrfSource() {
    if (inflightCsrfRefreshPromise !== null) {
        return inflightCsrfRefreshPromise;
    }

    inflightCsrfRefreshPromise = (async () => {
        try {
            const sanctumResponse = await fetch(csrfCookie.url(), {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (sanctumResponse.ok && readCookieValue('XSRF-TOKEN').length > 0) {
                return true;
            }
        } catch {
            // Ignore and fall back to reloading the app layout HTML.
        }

        try {
            return await refreshCsrfFromAppLayout();
        } catch {
            return false;
        }
    })().finally(() => {
        inflightCsrfRefreshPromise = null;
    });

    return inflightCsrfRefreshPromise;
}

export async function parseJsonPayload(response: Response): Promise<Record<string, unknown>> {
    return response.json().catch(() => ({})) as Promise<Record<string, unknown>>;
}

/**
 * Same-origin fetch with a single 419 CSRF retry (mirrors Sanctum / meta refresh flow).
 *
 * @param {string} url
 * @param {RequestInit} [init]
 * @param {boolean} [hasRetried]
 * @returns {Promise<Response>}
 */
export async function fetchWith419Retry(url: string, init: RequestInit = {}, hasRetried = false) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...init,
    });

    if (response.status === 419 && !hasRetried) {
        const csrfWasRefreshed = await refreshCsrfSource();
        if (csrfWasRefreshed) {
            return fetchWith419Retry(url, init, true);
        }
    }

    return response;
}

function headersInitToRecord(headers: HeadersInit | undefined): Record<string, string> {
    if (headers == null) {
        return {};
    }
    if (headers instanceof Headers) {
        return Object.fromEntries(headers.entries());
    }
    if (Array.isArray(headers)) {
        return Object.fromEntries(headers);
    }
    return { ...headers };
}

export async function requestJson(url: string, options: JsonRequestOptions = {}) {
    const { withCsrf, ...fetchOptions } = options;

    const response = await fetchWith419Retry(url, {
        ...fetchOptions,
        headers: buildJsonHeaders({
            ...headersInitToRecord(fetchOptions.headers),
            ...(withCsrf ? getCsrfHeaders() : {}),
        }),
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        if (response.status === 401) {
            dispatchAuthExpiredEvent();
        }

        const message = String(
            (payload as { message?: unknown })?.message ?? `Request to ${url} failed with ${response.status}`,
        );
        throw new Error(message);
    }

    return payload;
}

/**
 * Multipart POST with JSON response + CSRF retry (do not set Content-Type; browser sets boundary).
 *
 * @param {string} url
 * @param {FormData} formData
 * @param {{ withCsrf?: boolean }} [options]
 * @returns {Promise<Record<string, unknown>>}
 */
type FormDataRequestOptions = { withCsrf?: boolean };

export async function requestFormData(
    url: string,
    formData: FormData,
    options: FormDataRequestOptions = {},
) {
    const withCsrf = options.withCsrf === true;

    const response = await fetchWith419Retry(url, {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
        headers: {
            Accept: 'application/json',
            ...(withCsrf ? getCsrfHeaders() : {}),
        },
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        if (response.status === 401) {
            dispatchAuthExpiredEvent();
        }

        const message = String(
            (payload as { message?: unknown })?.message ?? `Request to ${url} failed with ${response.status}`,
        );
        throw new Error(message);
    }

    return payload;
}
