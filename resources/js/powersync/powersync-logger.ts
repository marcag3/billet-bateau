import { createBaseLogger, LogLevel } from "@powersync/common";
import * as Sentry from "@sentry/vue";

export function configurePowerSyncLogger(): void {
    const logger = createBaseLogger();
    logger.useDefaults();
    logger.setLevel(import.meta.env.PROD ? LogLevel.WARN : LogLevel.DEBUG);

    logger.setHandler((messages, context) => {
        if (!context?.level) {
            return;
        }

        const messageArray = Array.from(messages);
        const mainMessage = String(messageArray[0] || "Empty log message");
        const extraData = messageArray.slice(1).reduce<Record<string, unknown>>(
            (acc, curr) => {
                if (typeof curr === "object" && curr !== null) {
                    return { ...acc, ...(curr as Record<string, unknown>) };
                }
                return acc;
            },
            {},
        );

        const level = context.level.name.toLowerCase();

        Sentry.addBreadcrumb({
            message: mainMessage,
            level: level as Sentry.SeverityLevel,
            data: extraData,
            timestamp: Date.now() / 1000,
            category: "powersync",
        });

        if (level === "warn" || level === "error") {
            console[level](`PowerSync ${level.toUpperCase()}:`, mainMessage, extraData);
        }

        if (level === "error") {
            Sentry.captureMessage(`PowerSync error: ${mainMessage}`, {
                level: "error",
                extra: extraData,
            });
        }
    });
}
