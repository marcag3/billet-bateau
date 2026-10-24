import type { App } from "vue";
import * as Sentry from "@sentry/vue";

const sensitiveKeyDenyList = { deny: ["forwarded", "-ip", "remote-", "via", "-user"] };

/**
 * Sentry v11 collects user info, cookies and bodies by default (former `sendDefaultPii: true`).
 * This mirrors the v10 `sendDefaultPii: false` baseline from the v11 migration guide.
 */
const restrictedDataCollection = {
    userInfo: false,
    cookies: false,
    httpHeaders: {
        request: sensitiveKeyDenyList,
        response: sensitiveKeyDenyList,
    },
    httpBodies: [],
    urlQueryParams: sensitiveKeyDenyList,
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    graphQL: { document: false, variables: false },
} satisfies NonNullable<Parameters<typeof Sentry.init>[0]>["dataCollection"];

export function initSentry(app: App): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    if (!dsn) {
        return;
    }

    Sentry.init({
        app,
        dsn,
        release: import.meta.env.VITE_SENTRY_RELEASE,
        ...(import.meta.env.VITE_SENTRY_SEND_DEFAULT_PII === "false"
            ? { dataCollection: restrictedDataCollection }
            : {}),
        environment: import.meta.env.MODE,
        ignoreErrors: [
            // Facebook/Meta in-app browser injects scripts (e.g. sendDataToNative) that
            // assume window.webkit.messageHandlers exists outside a native WKWebView bridge.
            /window\.webkit\.messageHandlers/,
            // Facebook/Meta Android IAB (navigation_performance_logger_android) calls Java
            // bridge methods (postMessage, enableDidUserTypeOnKeyboardLogging, etc.) after
            // the WebView is torn down — typically on beforeunload during navigation away.
            /Java object is gone/,
        ],
    });
}
