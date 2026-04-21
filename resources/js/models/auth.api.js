import { readCookieValue } from '../utilities/cookies';
import { translate } from '../utilities/i18n';
import { csrfCookie } from '../routes/sanctum';
import { status as setupStatus, store as setupStore } from '../routes/setup';
import { destroy as sessionDestroy, me as sessionMe, store as sessionStore } from '../actions/App/Http/Controllers/Auth/SessionController';
import { buildJsonHeaders, parseJsonPayload, refreshCsrfSource } from '../services/http.client';

function getXsrfHeaders() {
    const xsrfToken = readCookieValue('XSRF-TOKEN');

    if (xsrfToken.length === 0) {
        return {};
    }

    return {
        'X-XSRF-TOKEN': xsrfToken,
    };
}

export async function fetchSetupStatus() {
    const response = await fetch(setupStatus.url(), {
        method: 'GET',
        credentials: 'same-origin',
        headers: buildJsonHeaders(
            {
                'Cache-Control': 'no-cache',
            },
            { includeRequestedWith: true },
        ),
    });

    if (!response.ok) {
        throw new Error(translate('auth.unableSetupStatus'));
    }

    const payload = await parseJsonPayload(response);
    return payload?.install_required === true;
}

async function requestWithCsrfRetry(url, options, hasRetried = false) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
    });

    if (response.status === 419 && !hasRetried) {
        const csrfWasRefreshed = await refreshCsrfSource();
        if (csrfWasRefreshed) {
            return requestWithCsrfRetry(url, options, true);
        }
    }

    return response;
}

export async function ensureCsrfCookie() {
    const response = await fetch(csrfCookie.url(), {
        method: 'GET',
        credentials: 'same-origin',
        headers: buildJsonHeaders(
            {},
            { includeRequestedWith: true },
        ),
    });

    if (!response.ok) {
        throw new Error(translate('auth.unableInitCsrf'));
    }
}

export async function fetchCurrentSession() {
    const response = await fetch(sessionMe.url(), {
        method: 'GET',
        credentials: 'same-origin',
        headers: buildJsonHeaders(
            {
                'Cache-Control': 'no-cache',
            },
            { includeRequestedWith: true },
        ),
    });

    if (response.status === 401) {
        return {
            isAuthenticated: false,
            user: null,
        };
    }

    if (!response.ok) {
        throw new Error(translate('auth.unableVerifySession'));
    }

    const payload = await parseJsonPayload(response);
    return {
        isAuthenticated: true,
        user: payload.user ?? null,
    };
}

export async function login({
    email,
    password,
    remember = false,
}) {
    await ensureCsrfCookie();

    const response = await requestWithCsrfRetry(sessionStore.url(), {
        method: 'POST',
        headers: buildJsonHeaders(
            {
                'Content-Type': 'application/json',
                ...getXsrfHeaders(),
            },
            { includeRequestedWith: true },
        ),
        body: JSON.stringify({
            email,
            password,
            remember,
        }),
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        const message = payload?.message ?? payload?.errors?.email?.[0] ?? translate('auth.unableSignInCreds');
        throw new Error(message);
    }

    return payload.user ?? null;
}

export async function completeSetup({
    organizationName,
    email,
    password,
    passwordConfirmation,
}) {
    await ensureCsrfCookie();

    const response = await requestWithCsrfRetry(setupStore.url(), {
        method: 'POST',
        headers: buildJsonHeaders(
            {
                'Content-Type': 'application/json',
                ...getXsrfHeaders(),
            },
            { includeRequestedWith: true },
        ),
        body: JSON.stringify({
            organization_name: organizationName,
            email,
            password,
            password_confirmation: passwordConfirmation,
        }),
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        const message =
            payload?.message ??
            payload?.errors?.organization_name?.[0] ??
            payload?.errors?.email?.[0] ??
            payload?.errors?.password?.[0] ??
            translate('auth.unableCompleteSetup');
        throw new Error(message);
    }

    return payload.user ?? null;
}

export async function logout() {
    await ensureCsrfCookie();

    await fetch(sessionDestroy.url(), {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildJsonHeaders(
            {
                ...getXsrfHeaders(),
            },
            { includeRequestedWith: true },
        ),
    });
}
