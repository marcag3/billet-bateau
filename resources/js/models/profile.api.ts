import { translate } from '../utilities/i18n';
import { csrfCookie } from '../routes/sanctum';
import {
    update as profileUpdate,
    updatePassword as profileUpdatePassword,
} from '../actions/App/Http/Controllers/Auth/ProfileController';
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

type AuthUser = {
    id: string;
    name: string;
    email: string;
};

async function ensureCsrfCookie(): Promise<void> {
    const response = await fetch(csrfCookie.url(), {
        method: 'GET',
        credentials: 'same-origin',
        headers: buildJsonHeaders({}, { includeRequestedWith: true }),
    });

    if (!response.ok) {
        throw new Error(translate('auth.unableInitCsrf'));
    }
}

function extractErrorMessage(
    payload: unknown,
    fallback: string,
    fieldOrder: string[] = [],
): string {
    const p = payload as LaravelErrorPayload;
    for (const field of fieldOrder) {
        const message = p.errors?.[field]?.[0];
        if (message != null && message.length > 0) {
            return message;
        }
    }

    return p.message ?? fallback;
}

export async function updateProfile({
    name,
    email,
}: {
    name: string;
    email: string;
}): Promise<AuthUser> {
    await ensureCsrfCookie();

    const response = await fetchWith419Retry(profileUpdate.url(), {
        method: 'PUT',
        headers: buildJsonHeaders(
            {
                'Content-Type': 'application/json',
                ...getCsrfHeaders(),
            },
            { includeRequestedWith: true },
        ),
        body: JSON.stringify({
            name,
            email,
        }),
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        throw new Error(
            extractErrorMessage(payload, translate('profile.unableUpdateProfile'), [
                'name',
                'email',
            ]),
        );
    }

    const user = (payload as { user?: AuthUser }).user;

    if (user == null) {
        throw new Error(translate('profile.unableUpdateProfile'));
    }

    return user;
}

export async function changePassword({
    currentPassword,
    password,
    passwordConfirmation,
}: {
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
}): Promise<string> {
    await ensureCsrfCookie();

    const response = await fetchWith419Retry(profileUpdatePassword.url(), {
        method: 'PUT',
        headers: buildJsonHeaders(
            {
                'Content-Type': 'application/json',
                ...getCsrfHeaders(),
            },
            { includeRequestedWith: true },
        ),
        body: JSON.stringify({
            current_password: currentPassword,
            password,
            password_confirmation: passwordConfirmation,
        }),
    });

    const payload = await parseJsonPayload(response);

    if (!response.ok) {
        throw new Error(
            extractErrorMessage(payload, translate('profile.unableChangePassword'), [
                'current_password',
                'password',
                'password_confirmation',
            ]),
        );
    }

    return (payload as { message?: string }).message ?? translate('profile.passwordChanged');
}
