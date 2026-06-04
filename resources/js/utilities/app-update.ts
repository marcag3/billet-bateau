import type { Router } from "vue-router";
import { registerSW } from "virtual:pwa-register";

const CHUNK_RELOAD_GUARD_KEY = "app:chunk-reload";

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
    void navigator.serviceWorker.ready.then((registration) => {
        void registration.update();
    });
}

export function registerAppServiceWorker(onRegistered?: () => void): void {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
        return;
    }

    registerSW({
        onRegisteredSW(_swScriptUrl, registration) {
            onRegistered?.();

            if (registration) {
                void registration.update();
            }
        },
        onRegisterError(error) {
            console.error("App service worker registration failed:", error);
        },
    });

    window.addEventListener("focus", checkForServiceWorkerUpdate);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            checkForServiceWorkerUpdate();
        }
    });
}
