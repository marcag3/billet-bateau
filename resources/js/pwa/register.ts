import type { Router } from "vue-router";
import {
    APP_SERVICE_WORKER_SCOPE,
    APP_SERVICE_WORKER_SCRIPT_URL,
} from "./constants";
import {
    clearChunkReloadGuard,
    handleLazyChunkLoadError,
    recoverFromStaleDeploy,
} from "./stale-chunks";

let updateTriggersAttached = false;

function isProductionServiceWorkerEnvironment(): boolean {
    return (
        import.meta.env.PROD &&
        "serviceWorker" in navigator &&
        window.isSecureContext
    );
}

async function getServiceWorkerRegistration(): Promise<
    ServiceWorkerRegistration | undefined
> {
    return navigator.serviceWorker.getRegistration(APP_SERVICE_WORKER_SCOPE);
}

function getServiceWorkerScriptPath(worker: ServiceWorker): string {
    return new URL(worker.scriptURL).pathname;
}

function registrationHasExpectedScript(
    registration: ServiceWorkerRegistration,
): boolean {
    const worker =
        registration.active ??
        registration.waiting ??
        registration.installing;

    if (worker === null) {
        return true;
    }

    return (
        getServiceWorkerScriptPath(worker) === APP_SERVICE_WORKER_SCRIPT_URL
    );
}

async function ensureAppServiceWorker(): Promise<void> {
    let registration = await getServiceWorkerRegistration();

    if (
        registration !== undefined &&
        !registrationHasExpectedScript(registration)
    ) {
        await registration.unregister();
        registration = undefined;
    }

    if (registration !== undefined) {
        try {
            await registration.update();
            return;
        } catch (error: unknown) {
            console.error("App service worker update failed:", error);
            await registration.unregister();
        }
    }

    try {
        const newRegistration = await navigator.serviceWorker.register(
            APP_SERVICE_WORKER_SCRIPT_URL,
            { scope: APP_SERVICE_WORKER_SCOPE },
        );
        await newRegistration.update();
    } catch (error: unknown) {
        console.error("App service worker registration failed:", error);
    }
}

async function checkForServiceWorkerUpdate(): Promise<void> {
    await ensureAppServiceWorker();
}

function attachServiceWorkerUpdateTriggers(): void {
    if (updateTriggersAttached) {
        return;
    }

    updateTriggersAttached = true;

    window.addEventListener("focus", () => {
        void checkForServiceWorkerUpdate();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            void checkForServiceWorkerUpdate();
        }
    });
}

function listenForServiceWorkerControllerChange(): void {
    let refreshing = false;
    const hadController = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController || refreshing) {
            return;
        }

        refreshing = true;
        clearChunkReloadGuard();
        window.location.reload();
    });
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
        recoverFromStaleDeploy();
    });

    window.addEventListener("unhandledrejection", (event) => {
        if (handleLazyChunkLoadError(event.reason)) {
            event.preventDefault();
        }
    });

    void router.isReady().then(clearChunkReloadGuard);
}

export function registerAppServiceWorker(): void {
    if (!isProductionServiceWorkerEnvironment()) {
        return;
    }

    listenForServiceWorkerControllerChange();
    attachServiceWorkerUpdateTriggers();

    void ensureAppServiceWorker();
}
