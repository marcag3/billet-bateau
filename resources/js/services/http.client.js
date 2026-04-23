import { readCookieValue } from '../utilities/cookies';
import { APP_AUTH_EXPIRED_EVENT } from '../utilities/events';
import { csrfCookie } from '../routes/sanctum';

const API_HEADERS = {
    Accept: 'application/json',
};

let inflightCsrfRefreshPromise = null;

function dispatchAuthExpiredEvent() {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(APP_AUTH_EXPIRED_EVENT));
}

function getCsrfTokenFromMeta() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function setCsrfTokenMeta(token) {
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

function getCsrfHeaders() {
    const headers = {};
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

export function buildJsonHeaders(extraHeaders = {}, { includeRequestedWith = false } = {}) {
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

export async function parseJsonPayload(response) {
    return response.json().catch(() => ({}));
}

export async function requestJson(url, options = {}) {
    const withCsrf = options.withCsrf === true;
    const fetchOptions = { ...options };
    delete fetchOptions.withCsrf;

    const sendRequest = () =>
        fetch(url, {
            credentials: 'same-origin',
            ...fetchOptions,
            headers: buildJsonHeaders({
                ...fetchOptions.headers,
                ...(withCsrf ? getCsrfHeaders() : {}),
            }),
        });

    let response = await sendRequest();

    // #region agent log
    try {
        const path = typeof url === 'string' ? url.split('?')[0] : '';
        if (path.includes('/api/')) {
            const loc =
                typeof window !== 'undefined' && window.location
                    ? `${window.location.protocol}//${window.location.host}`
                    : '';
            fetch('/api/_cursor-debug/ingest-d855ad', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    sessionId: 'd855ad',
                    runId: 'pre-fix',
                    hypothesisId: 'H1',
                    location: 'http.client.js:requestJson',
                    message: 'api fetch first response',
                    data: {
                        pageOrigin: loc,
                        pageHost: typeof window !== 'undefined' && window.location ? window.location.host : '',
                        requestPath: path,
                        status: response.status,
                        ok: response.ok,
                        hasCsrfMeta:
                            typeof document !== 'undefined' &&
                            (document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')?.length ?? 0) > 0,
                    },
                    timestamp: Date.now(),
                }),
            }).catch(() => {});
        }
    } catch {
        /* ignore debug log errors */
    }
    // #endregion

    if (response.status === 419) {
        const csrfWasRefreshed = await refreshCsrfSource();
        if (csrfWasRefreshed) {
            response = await sendRequest();
        }
    }

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        if (response.status === 401) {
            dispatchAuthExpiredEvent();
        }

        const message = payload?.message ?? `Request to ${url} failed with ${response.status}`;
        throw new Error(message);
    }

    return payload;
}
