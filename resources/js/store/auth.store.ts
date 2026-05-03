import { defineStore } from "pinia";
import {
    completeSetup as completeSetupRequest,
    fetchCurrentSession,
    fetchSetupStatus as fetchSetupStatusRequest,
    login as loginRequest,
    logout as logoutRequest,
} from "../models/auth.api";
import { translate } from "../utilities/i18n";
import { setActiveProgramId } from "../powersync/app-powersync.runtime";

const AUTH_MARKER_STORAGE_KEY = "app.hasAuthenticatedOnce";

function readInitialAuthMarker() {
    if (typeof window === "undefined") {
        return false;
    }

    return window.localStorage.getItem(AUTH_MARKER_STORAGE_KEY) === "1";
}

function persistAuthMarker(enabled) {
    if (typeof window === "undefined") {
        return;
    }

    if (enabled) {
        window.localStorage.setItem(AUTH_MARKER_STORAGE_KEY, "1");
        return;
    }

    window.localStorage.removeItem(AUTH_MARKER_STORAGE_KEY);
}

export const useAuthStore = defineStore("auth", {
    state: () => ({
        isInitialized: false,
        isAuthenticated: false,
        hasAuthenticatedBefore: readInitialAuthMarker(),
        installRequired: null,
        user: null,
        requiresReauthentication: false,
        authErrorMessage: "",
    }),
    actions: {
        markAuthenticated(user) {
            this.isAuthenticated = true;
            this.user = user;
            this.hasAuthenticatedBefore = true;
            this.requiresReauthentication = false;
            this.authErrorMessage = "";

            persistAuthMarker(true);
        },
        markAuthExpired(message = translate("auth.sessionExpired")) {
            this.isAuthenticated = false;
            this.user = null;
            this.requiresReauthentication = true;
            this.authErrorMessage = message;
        },
        async initialize() {
            if (this.isInitialized) {
                return;
            }

            await this.refreshSession({
                allowOfflineFallback: true,
                markInitialized: true,
                silent: true,
            });

            try {
                await this.fetchSetupStatus({ force: true });
            } catch {
                this.installRequired = false;
            }
        },
        async fetchSetupStatus({ force = false } = {}) {
            if (!force && this.installRequired !== null) {
                return this.installRequired;
            }

            this.installRequired = await fetchSetupStatusRequest();
            return this.installRequired;
        },
        async refreshSession({
            allowOfflineFallback = false,
            markInitialized = false,
            silent = false,
        } = {}) {
            try {
                const session = await fetchCurrentSession();

                if (!session.isAuthenticated) {
                    this.isAuthenticated = false;
                    this.user = null;
                    this.requiresReauthentication = false;

                    if (!silent) {
                        this.authErrorMessage = translate(
                            "auth.pleaseSignInContinue",
                        );
                    }

                    if (markInitialized) {
                        this.isInitialized = true;
                    }

                    return false;
                }

                this.markAuthenticated(session.user);

                if (markInitialized) {
                    this.isInitialized = true;
                }

                return true;
            } catch (error) {
                if (
                    allowOfflineFallback &&
                    !navigator.onLine &&
                    this.hasAuthenticatedBefore
                ) {
                    if (markInitialized) {
                        this.isInitialized = true;
                    }

                    return true;
                }

                this.isAuthenticated = false;
                this.user = null;

                if (!silent) {
                    this.authErrorMessage =
                        error instanceof Error
                            ? error.message
                            : translate("auth.unableVerifySession");
                }

                if (markInitialized) {
                    this.isInitialized = true;
                }

                return false;
            }
        },
        async login({ email, password, remember = false }) {
            const user = await loginRequest({
                email,
                password,
                remember,
            });
            this.markAuthenticated(user);
        },
        async completeSetup({
            organizationName,
            email,
            password,
            passwordConfirmation,
        }) {
            await completeSetupRequest({
                organizationName,
                email,
                password,
                passwordConfirmation,
            });

            setActiveProgramId("");

            this.isAuthenticated = false;
            this.user = null;
            this.hasAuthenticatedBefore = false;
            this.requiresReauthentication = false;
            this.authErrorMessage = "";
            this.installRequired = false;

            persistAuthMarker(false);
        },
        async logout() {
            await logoutRequest();

            setActiveProgramId("");

            this.isAuthenticated = false;
            this.user = null;
            this.hasAuthenticatedBefore = false;
            this.requiresReauthentication = false;
            this.authErrorMessage = "";

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
            this.authErrorMessage = "";
        },
    },
});
