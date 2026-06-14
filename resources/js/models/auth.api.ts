import { translate } from '../utilities/i18n';
import { csrfCookie } from '../routes/sanctum';
import { status as setupStatus, store as setupStore } from '../routes/setup';
import {
    reset as passwordReset,
    sendLink as passwordSendLink,
} from '../actions/App/Http/Controllers/Auth/PasswordResetController';
import { destroy as sessionDestroy, me as sessionMe, store as sessionStore } from '../actions/App/Http/Controllers/Auth/SessionController';
import {
    buildJsonHeaders,
    fetchWith419Retry,
    getCsrfHeaders,
    parseJsonPayload,
} from '../services/http.client';

type LaravelErrorPayload = {
    message?: string;
    errors?: Record<string, string[] | undefined>;
};

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

async function ensureCsrfCookie() {
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

    const response = await fetchWith419Retry(sessionStore.url(), {
        method: 'POST',
        headers: buildJsonHeaders(
            {
                'Content-Type': 'application/json',
                ...getCsrfHeaders(),
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
        const p = payload as LaravelErrorPayload;
        const message = p.message ?? p.errors?.email?.[0] ?? translate('auth.unableSignInCreds');
        throw new Error(message);
    }

    return (payload as { user?: unknown }).user ?? null;
}

export async function completeSetup({
    organizationName,
    email,
    password,
    passwordConfirmation,
}) {
    await ensureCsrfCookie();

    const response = await fetchWith419Retry(setupStore.url(), {
        method: 'POST',
        headers: buildJsonHeaders(
            {
                'Content-Type': 'application/json',
                ...getCsrfHeaders(),
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
        const p = payload as LaravelErrorPayload;
        const message =
            p.message ??
            p.errors?.organization_name?.[0] ??
            p.errors?.email?.[0] ??
            p.errors?.password?.[0] ??
            translate('auth.unableCompleteSetup');
        throw new Error(message);
    }

    return (payload as { user?: unknown }).user ?? null;
}

export async function logout() {
    await ensureCsrfCookie();

    await fetchWith419Retry(sessionDestroy.url(), {
        method: 'POST',
        headers: buildJsonHeaders(
            {
                ...getCsrfHeaders(),
            },
            { includeRequestedWith: true },
        ),
    });
}

export async function requestPasswordReset({ email }) {
    await ensureCsrfCookie();

    const response = await fetchWith419Retry(passwordSendLink.url(), {
        method: 'POST',
        headers: buildJsonHeaders(
            {
                'Content-Type': 'application/json',
                ...getCsrfHeaders(),
            },
            { includeRequestedWith: true },
        ),
        body: JSON.stringify({ email }),
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        const p = payload as LaravelErrorPayload;
        const message = p.message ?? p.errors?.email?.[0] ?? translate('auth.forgotPassword.unableSend');
        throw new Error(message);
    }

    return (payload as { message?: string }).message ?? translate('auth.forgotPassword.success');
}

export async function resetPassword({
    token,
    email,
    password,
    passwordConfirmation,
}) {
    await ensureCsrfCookie();

    const response = await fetchWith419Retry(passwordReset.url(), {
        method: 'POST',
        headers: buildJsonHeaders(
            {
                'Content-Type': 'application/json',
                ...getCsrfHeaders(),
            },
            { includeRequestedWith: true },
        ),
        body: JSON.stringify({
            token,
            email,
            password,
            password_confirmation: passwordConfirmation,
        }),
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        const p = payload as LaravelErrorPayload;
        const message =
            p.message ??
            p.errors?.email?.[0] ??
            p.errors?.password?.[0] ??
            translate('auth.resetPassword.unableReset');
        throw new Error(message);
    }

    return (payload as { message?: string }).message ?? translate('auth.resetPassword.success');
}
