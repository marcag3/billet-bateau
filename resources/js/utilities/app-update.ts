import type { Router } from "vue-router";

const CHUNK_RELOAD_GUARD_KEY = "app:chunk-reload";
export const APP_SERVICE_WORKER_SCRIPT_URL = "/app/sw.js";
export const APP_SERVICE_WORKER_SCOPE = "/app/";

let serviceWorkerUpdateTriggersAttached = false;

export function clearChunkReloadGuard(): void {
    sessionStorage.removeItem(CHUNK_RELOAD_GUARD_KEY);
}

export function isLazyChunkLoadError(error: unknown): boolean {
    const message =
        error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "";

    return (
        /Failed to fetch dynamically imported module/i.test(message) ||
        /Importing a module script failed/i.test(message) ||
        /error loading dynamically imported module/i.test(message) ||
        /Unable to preload CSS/i.test(message)
    );
}

function reloadForStaleAssets(): void {
    if (sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) === "1") {
        return;
    }

    sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, "1");
    window.location.reload();
}

export function handleLazyChunkLoadError(error: unknown): boolean {
    if (!isLazyChunkLoadError(error)) {
        return false;
    }

    reloadForStaleAssets();

    return true;
}

export function registerLazyChunkReloadHandlers(router: Router): void {
    if (!import.meta.env.PROD) {
        return;
    }

    router.onError((error) => {
        handleLazyChunkLoadError(error);
    });

    window.addEventListener("vite:preloadError", (event) => {
        event.preventDefault();
        reloadForStaleAssets();
    });

    void router.isReady().then(() => {
        clearChunkReloadGuard();
    });
}

function checkForServiceWorkerUpdate(): void {
    void navigator.serviceWorker.getRegistration(APP_SERVICE_WORKER_SCOPE).then(
        (registration) => {
            if (registration == null) {
                return;
            }

            void registration.update();
        },
    );
}

function attachServiceWorkerUpdateTriggers(): void {
    if (serviceWorkerUpdateTriggersAttached) {
        return;
    }

    serviceWorkerUpdateTriggersAttached = true;

    window.addEventListener("focus", checkForServiceWorkerUpdate);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            checkForServiceWorkerUpdate();
        }
    });
}

function listenForServiceWorkerUpdates(): void {
    let refreshing = false;
    const hadController = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController || refreshing) {
            return;
        }

        refreshing = true;
        window.location.reload();
    });
}

export async function shouldRegisterAppServiceWorker(): Promise<boolean> {
    if (navigator.serviceWorker.controller !== null) {
        return false;
    }

    const existing = await navigator.serviceWorker.getRegistration(
        APP_SERVICE_WORKER_SCOPE,
    );

    return existing === undefined;
}

export function registerAppServiceWorker(onRegistered?: () => void): void {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
        return;
    }

    listenForServiceWorkerUpdates();
    attachServiceWorkerUpdateTriggers();

    void (async () => {
        const existing = await navigator.serviceWorker.getRegistration(
            APP_SERVICE_WORKER_SCOPE,
        );

        if (existing !== undefined) {
            onRegistered?.();
            void existing.update();
            return;
        }

        if (navigator.serviceWorker.controller !== null) {
            onRegistered?.();
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register(
                APP_SERVICE_WORKER_SCRIPT_URL,
                {
                    scope: APP_SERVICE_WORKER_SCOPE,
                },
            );
            onRegistered?.();
            void registration.update();
        } catch (error: unknown) {
            console.error("App service worker registration failed:", error);
        }
    })();
}
