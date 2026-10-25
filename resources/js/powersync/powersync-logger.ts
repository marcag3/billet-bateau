import { LogLevels, type LogRecord, type PowerSyncLogger } from "@powersync/common";
import * as Sentry from "@sentry/vue";
import { shouldSuppressPowerSyncErrorForSentry } from "./sync-health";
import { syncHealthSnapshot } from "./sync-health-state";

function resolveLogLevelName(level: number): Sentry.SeverityLevel {
    if (level >= LogLevels.error) {
        return "error";
    }
    if (level >= LogLevels.warn) {
        return "warning";
    }
    if (level >= LogLevels.info) {
        return "info";
    }
    return "debug";
}

function resolveErrorData(error: unknown): Record<string, unknown> {
    if (error === undefined) {
        return {};
    }
    if (error instanceof Error) {
        return { error: error.message, stack: error.stack };
    }
    return { error: typeof error === "object" && error !== null ? error : String(error) };
}

/**
 * PowerSync logger passed to `new PowerSyncDatabase({ logger })`: records breadcrumbs,
 * forwards warnings/errors to the console and reports errors to Sentry.
 */
export function createPowerSyncLogger(): PowerSyncLogger {
    const minimumLevel = import.meta.env.PROD ? LogLevels.warn : LogLevels.debug;

    return {
        log(record: LogRecord): void {
            if (record.level < minimumLevel) {
                return;
            }

            const mainMessage = record.message || "Empty log message";
            const extraData = resolveErrorData(record.error);
            const level = resolveLogLevelName(record.level);

            Sentry.addBreadcrumb({
                message: mainMessage,
                level,
                data: extraData,
                timestamp: Date.now() / 1000,
                category: "powersync",
            });

            if (level === "warning") {
                console.warn("PowerSync WARN:", mainMessage, extraData);
            }

            if (level !== "error") {
                return;
            }

            console.error("PowerSync ERROR:", mainMessage, extraData);

            const snapshot = syncHealthSnapshot.value;

            if (
                shouldSuppressPowerSyncErrorForSentry(mainMessage, {
                    browserOnline: snapshot.browserOnline,
                    connectingSinceMs: snapshot.connectingSinceMs,
                    nowMs: Date.now(),
                })
            ) {
                return;
            }

            Sentry.captureMessage(`PowerSync error: ${mainMessage}`, {
                level: "error",
                extra: extraData,
            });
        },
    };
}
