import { defineStore } from 'pinia';

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
        markAuthExpired(message = 'Your session expired. Please sign in again.') {
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
        },
        async ensureCsrfCookie() {
            const response = await fetch('/sanctum/csrf-cookie', {
                method: 'GET',
                credentials: 'same-origin',
                headers: buildHeaders(),
            });

            if (!response.ok) {
                throw new Error('Unable to initialize CSRF protection.');
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
                        this.authErrorMessage = 'Please sign in to continue.';
                    }

                    if (markInitialized) {
                        this.isInitialized = true;
                    }

                    return false;
                }

                if (!response.ok) {
                    throw new Error('Unable to verify the current session.');
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
                        error instanceof Error ? error.message : 'Unable to verify the current session.';
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
                    'Unable to sign in with the provided credentials.';
                throw new Error(message);
            }

            this.markAuthenticated(payload.user ?? null);
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
