import { defineStore } from 'pinia';
import { translate } from '../../i18n';

const AUTH_MARKER_STORAGE_KEY = 'app.hasAuthenticatedOnce';

function readCookieValue(name) {
    if (typeof document === 'undefined') {
        return '';
    }

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

function readInitialAuthMarker() {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.localStorage.getItem(AUTH_MARKER_STORAGE_KEY) === '1';
}

function persistAuthMarker(enabled) {
    if (typeof window === 'undefined') {
        return;
    }

    if (enabled) {
        window.localStorage.setItem(AUTH_MARKER_STORAGE_KEY, '1');
        return;
    }

    window.localStorage.removeItem(AUTH_MARKER_STORAGE_KEY);
}

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

export const useAuthStore = defineStore('auth', {
    state: () => ({
        isInitialized: false,
        isAuthenticated: false,
        hasAuthenticatedBefore: readInitialAuthMarker(),
        installRequired: null,
        user: null,
        requiresReauthentication: false,
        authErrorMessage: '',
    }),
    actions: {
        markAuthenticated(user) {
            this.isAuthenticated = true;
            this.user = user;
            this.hasAuthenticatedBefore = true;
            this.requiresReauthentication = false;
            this.authErrorMessage = '';

            persistAuthMarker(true);
        },
        markAuthExpired(message = translate('auth.sessionExpired')) {
            this.isAuthenticated = false;
            this.user = null;
            this.requiresReauthentication = true;
            this.authErrorMessage = message;
        },
        async initialize() {
            if (this.isInitialized) {
                return;
            }

            await this.refreshSession({ allowOfflineFallback: true, markInitialized: true, silent: true });

            try {
                await this.fetchSetupStatus({ force: true });
            } catch (_error) {
                this.installRequired = false;
            }
        },
        async fetchSetupStatus({ force = false } = {}) {
            if (!force && this.installRequired !== null) {
                return this.installRequired;
            }

            const response = await fetch('/setup/status', {
                method: 'GET',
                credentials: 'same-origin',
                headers: buildHeaders({
                    'Cache-Control': 'no-cache',
                }),
            });

            if (!response.ok) {
                throw new Error(translate('auth.unableSetupStatus'));
            }

            const payload = await response.json().catch(() => ({}));
            this.installRequired = payload?.install_required === true;

            return this.installRequired;
        },
        async ensureCsrfCookie() {
            const response = await fetch('/sanctum/csrf-cookie', {
                method: 'GET',
                credentials: 'same-origin',
                headers: buildHeaders(),
            });

            if (!response.ok) {
                throw new Error(translate('auth.unableInitCsrf'));
            }
        },
        async refreshSession({ allowOfflineFallback = false, markInitialized = false, silent = false } = {}) {
            try {
                const response = await fetch('/api/auth/me', {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: buildHeaders({
                        'Cache-Control': 'no-cache',
                    }),
                });

                if (response.status === 401) {
                    this.isAuthenticated = false;
                    this.user = null;
                    this.requiresReauthentication = false;

                    if (!silent) {
                        this.authErrorMessage = translate('auth.pleaseSignInContinue');
                    }

                    if (markInitialized) {
                        this.isInitialized = true;
                    }

                    return false;
                }

                if (!response.ok) {
                    throw new Error(translate('auth.unableVerifySession'));
                }

                const payload = await response.json();
                this.markAuthenticated(payload.user ?? null);

                if (markInitialized) {
                    this.isInitialized = true;
                }

                return true;
            } catch (error) {
                if (allowOfflineFallback && !navigator.onLine && this.hasAuthenticatedBefore) {
                    if (markInitialized) {
                        this.isInitialized = true;
                    }

                    return true;
                }

                this.isAuthenticated = false;
                this.user = null;

                if (!silent) {
                    this.authErrorMessage =
                        error instanceof Error ? error.message : translate('auth.unableVerifySession');
                }

                if (markInitialized) {
                    this.isInitialized = true;
                }

                return false;
            }
        },
        async login({ email, password, remember = false, hasRetried = false }) {
            await this.ensureCsrfCookie();

            const response = await fetch('/login', {
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
                await this.ensureCsrfCookie();
                return this.login({ email, password, remember, hasRetried: true });
            }

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message =
                    payload?.message ??
                    payload?.errors?.email?.[0] ??
                    translate('auth.unableSignInCreds');
                throw new Error(message);
            }

            this.markAuthenticated(payload.user ?? null);
        },
        async completeSetup({
            organizationName,
            email,
            password,
            passwordConfirmation,
            hasRetried = false,
        }) {
            await this.ensureCsrfCookie();

            const response = await fetch('/setup', {
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
                await this.ensureCsrfCookie();
                return this.completeSetup({
                    organizationName,
                    email,
                    password,
                    passwordConfirmation,
                    hasRetried: true,
                });
            }

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                const message =
                    payload?.message ??
                    payload?.errors?.organization_name?.[0] ??
                    payload?.errors?.email?.[0] ??
                    payload?.errors?.password?.[0] ??
                    translate('auth.unableCompleteSetup');
                throw new Error(message);
            }

            this.markAuthenticated(payload.user ?? null);
            this.installRequired = false;
        },
        async logout() {
            await this.ensureCsrfCookie();

            await fetch('/logout', {
                method: 'POST',
                credentials: 'same-origin',
                headers: buildHeaders({
                    ...getXsrfHeaders(),
                }),
            });

            this.isAuthenticated = false;
            this.user = null;
            this.hasAuthenticatedBefore = false;
            this.requiresReauthentication = false;
            this.authErrorMessage = '';

            persistAuthMarker(false);
        },
        async revalidateAfterReconnect() {
            if (!this.hasAuthenticatedBefore) {
                return true;
            }

            const isStillAuthenticated = await this.refreshSession({
                allowOfflineFallback: false,
                markInitialized: true,
                silent: true,
            });

            if (isStillAuthenticated) {
                this.requiresReauthentication = false;
                return true;
            }

            this.markAuthExpired();

            return false;
        },
        canAccessProtectedRoute() {
            if (this.isAuthenticated) {
                return true;
            }

            return !navigator.onLine && this.hasAuthenticatedBefore;
        },
        clearReauthenticationPrompt() {
            this.requiresReauthentication = false;
            this.authErrorMessage = '';
        },
    },
});
