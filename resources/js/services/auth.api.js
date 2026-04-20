import { readCookieValue } from '../utilities/cookies';
import { translate } from '../utilities/i18n';
import { csrfCookie } from '../routes/sanctum';
import { status as setupStatus, store as setupStore } from '../routes/setup';
import { destroy as sessionDestroy, me as sessionMe, store as sessionStore } from '../actions/App/Http/Controllers/Auth/SessionController';

function buildHeaders(extraHeaders = {}) {
    return {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...extraHeaders,
    };
}

function getXsrfHeaders() {
    const xsrfToken = readCookieValue('XSRF-TOKEN');

    if (xsrfToken.length === 0) {
        return {};
    }

    return {
        'X-XSRF-TOKEN': xsrfToken,
    };
}

async function parseResponsePayload(response) {
    return response.json().catch(() => ({}));
}

export async function fetchSetupStatus() {
    const response = await fetch(setupStatus.url(), {
        method: 'GET',
        credentials: 'same-origin',
        headers: buildHeaders({
            'Cache-Control': 'no-cache',
        }),
    });

    if (!response.ok) {
        throw new Error(translate('auth.unableSetupStatus'));
    }

    const payload = await parseResponsePayload(response);
    return payload?.install_required === true;
}

export async function ensureCsrfCookie() {
    const response = await fetch(csrfCookie.url(), {
        method: 'GET',
        credentials: 'same-origin',
        headers: buildHeaders(),
    });

    if (!response.ok) {
        throw new Error(translate('auth.unableInitCsrf'));
    }
}

export async function fetchCurrentSession() {
    const response = await fetch(sessionMe.url(), {
        method: 'GET',
        credentials: 'same-origin',
        headers: buildHeaders({
            'Cache-Control': 'no-cache',
        }),
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

    const payload = await parseResponsePayload(response);
    return {
        isAuthenticated: true,
        user: payload.user ?? null,
    };
}

export async function login({
    email,
    password,
    remember = false,
    hasRetried = false,
}) {
    await ensureCsrfCookie();

    const response = await fetch(sessionStore.url(), {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildHeaders({
            'Content-Type': 'application/json',
            ...getXsrfHeaders(),
        }),
        body: JSON.stringify({
            email,
            password,
            remember,
        }),
    });

    if (response.status === 419 && !hasRetried) {
        await ensureCsrfCookie();
        return login({ email, password, remember, hasRetried: true });
    }

    const payload = await parseResponsePayload(response);

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
    hasRetried = false,
}) {
    await ensureCsrfCookie();

    const response = await fetch(setupStore.url(), {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildHeaders({
            'Content-Type': 'application/json',
            ...getXsrfHeaders(),
        }),
        body: JSON.stringify({
            organization_name: organizationName,
            email,
            password,
            password_confirmation: passwordConfirmation,
        }),
    });

    if (response.status === 419 && !hasRetried) {
        await ensureCsrfCookie();
        return completeSetup({
            organizationName,
            email,
            password,
            passwordConfirmation,
            hasRetried: true,
        });
    }

    const payload = await parseResponsePayload(response);

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
        headers: buildHeaders({
            ...getXsrfHeaders(),
        }),
    });
}
