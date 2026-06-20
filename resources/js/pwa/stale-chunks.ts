import { APP_SERVICE_WORKER_SCOPE } from "./constants";

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

async function clearAppRuntimeCaches(): Promise<void> {
    if (!("caches" in window)) {
        return;
    }

    const cacheNames = await caches.keys();

    await Promise.all(
        cacheNames
            .filter((name) => name.startsWith("app-"))
            .map((name) => caches.delete(name)),
    );
}

async function forceServiceWorkerUpdate(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    const registration = await navigator.serviceWorker.getRegistration(
        APP_SERVICE_WORKER_SCOPE,
    );

    await registration?.update();
}

async function reloadForStaleAssets(): Promise<void> {
    const attempt = sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY);

    if (attempt === "2") {
        return;
    }

    if (attempt === "1") {
        await clearAppRuntimeCaches();
        await forceServiceWorkerUpdate();
        sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, "2");
    } else {
        sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, "1");
    }

    window.location.reload();
}

export function recoverFromStaleDeploy(): void {
    void reloadForStaleAssets();
}

export function handleLazyChunkLoadError(error: unknown): boolean {
    if (!isLazyChunkLoadError(error)) {
        return false;
    }

    void reloadForStaleAssets();

    return true;
}
