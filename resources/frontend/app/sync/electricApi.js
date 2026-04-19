const API_HEADERS = {
    Accept: 'application/json',
};

let cachedToken = null;
let cachedExpiryTimestamp = 0;
let inflightTokenPromise = null;
let inflightCsrfRefreshPromise = null;

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

function getCookieValue(name) {
    const cookiePrefix = `${name}=`;
    const matchedCookie = document.cookie
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(cookiePrefix));

    if (!matchedCookie) {
        return '';
    }

    return decodeURIComponent(matchedCookie.slice(cookiePrefix.length));
}

function getCsrfHeaders() {
    const headers = {};
    const csrfToken = getCsrfTokenFromMeta();
    const xsrfToken = getCookieValue('XSRF-TOKEN');

    if (csrfToken.length > 0) {
        headers['X-CSRF-TOKEN'] = csrfToken;
    }

    if (xsrfToken.length > 0) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
    }

    return headers;
}

function parseExpiryTimestamp(isoDate) {
    const timestamp = Date.parse(isoDate ?? '');
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function buildHeaders(extraHeaders = {}) {
    return {
        ...API_HEADERS,
        ...extraHeaders,
    };
}

async function refreshCsrfFromAppShell() {
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

async function refreshCsrfSource() {
    if (inflightCsrfRefreshPromise !== null) {
        return inflightCsrfRefreshPromise;
    }

    inflightCsrfRefreshPromise = (async () => {
        try {
            const sanctumResponse = await fetch('/sanctum/csrf-cookie', {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                },
            });

            if (sanctumResponse.ok && getCookieValue('XSRF-TOKEN').length > 0) {
                return true;
            }
        } catch {
            // Ignore and fall back to reloading the app shell.
        }

        try {
            return await refreshCsrfFromAppShell();
        } catch {
            return false;
        }
    })().finally(() => {
        inflightCsrfRefreshPromise = null;
    });

    return inflightCsrfRefreshPromise;
}

async function requestJson(url, options = {}) {
    const withCsrf = options.withCsrf === true;
    const fetchOptions = { ...options };
    delete fetchOptions.withCsrf;

    const sendRequest = () =>
        fetch(url, {
            credentials: 'same-origin',
            ...fetchOptions,
            headers: buildHeaders({
                ...fetchOptions.headers,
                ...(withCsrf ? getCsrfHeaders() : {}),
            }),
        });

    let response = await sendRequest();

    if (response.status === 419) {
        const csrfWasRefreshed = await refreshCsrfSource();
        if (csrfWasRefreshed) {
            response = await sendRequest();
        }
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = payload?.message ?? `Request to ${url} failed with ${response.status}`;
        throw new Error(message);
    }

    return payload;
}

export function getElectricShapeUrl() {
    const configuredUrl = import.meta.env.VITE_ELECTRIC_URL;
    const baseUrl = configuredUrl && configuredUrl.length > 0 ? configuredUrl : 'http://localhost:5133';

    return `${baseUrl.replace(/\/$/, '')}/v1/shape`;
}

export function clearElectricTokenCache() {
    cachedToken = null;
    cachedExpiryTimestamp = 0;
}

export async function getElectricToken({ forceRefresh = false } = {}) {
    const now = Date.now();
    const isTokenFresh = cachedToken !== null && now < cachedExpiryTimestamp - 10_000;

    if (!forceRefresh && isTokenFresh) {
        return cachedToken;
    }

    if (inflightTokenPromise !== null) {
        return inflightTokenPromise;
    }

    inflightTokenPromise = requestJson('/api/electric/token')
        .then((payload) => {
            cachedToken = payload.token;
            cachedExpiryTimestamp = parseExpiryTimestamp(payload.expires_at);

            return cachedToken;
        })
        .finally(() => {
            inflightTokenPromise = null;
        });

    return inflightTokenPromise;
}

export async function createTodo(payload) {
    return requestJson('/api/todos', {
        method: 'POST',
        withCsrf: true,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

export async function updateTodo(id, payload) {
    return requestJson(`/api/todos/${id}`, {
        method: 'PUT',
        withCsrf: true,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

//TODO: todo don't belongs in electric api.
export async function deleteTodo(id) {
    return requestJson(`/api/todos/${id}`, {
        method: 'DELETE',
        withCsrf: true,
    });
}
