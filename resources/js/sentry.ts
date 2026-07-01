import type { App } from "vue";
import * as Sentry from "@sentry/vue";

export function initSentry(app: App): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn) {
        return;
    }

    Sentry.init({
        app,
        dsn,
        release: import.meta.env.VITE_SENTRY_RELEASE,
        sendDefaultPii: import.meta.env.VITE_SENTRY_SEND_DEFAULT_PII !== "false",
        environment: import.meta.env.MODE,
        ignoreErrors: [
            // Facebook/Meta in-app browser injects scripts (e.g. sendDataToNative) that
            // assume window.webkit.messageHandlers exists outside a native WKWebView bridge.
            /window\.webkit\.messageHandlers/,
        ],
    });
}
