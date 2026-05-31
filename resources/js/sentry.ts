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
        sendDefaultPii: import.meta.env.VITE_SENTRY_SEND_DEFAULT_PII !== "false",
        environment: import.meta.env.MODE,
    });
}
