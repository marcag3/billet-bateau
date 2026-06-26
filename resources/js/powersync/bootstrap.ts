import { PowerSyncDatabase } from "@powersync/web";
import { fetchCurrentSession } from "../models/auth.api";
import { useAuthStore } from "../store/auth.store";
import { createAppPowerSyncConnector } from "../services/powersync.connector";
import { appPowerSyncSchema } from "./app.powersync-schema";
import { wirePowerSyncCollections } from "./collections.registry";
import {
    formatPowerSyncUploadError,
    refreshOutboxSnapshot,
    resolveOutboxCommitError,
} from "./outbox";
import {
    attachProgramScopeStreamSubscription,
    attachUserScopeStream,
    detachAllPowerSyncStreams,
} from "./streams";
import type { SyncStatus } from "@powersync/common";
import * as runtimeState from "./powersync-runtime-state";
import { isProgramScopePrioritySynced } from "./program-scope-sync-status";
import { isUserScopePrioritySynced } from "./user-scope-sync-status";
import {
    applySyncHealthFromStatus,
    markSyncHealthUnavailable,
    publishSyncHealthSnapshot,
    resetSyncHealthSnapshot,
    trackBrowserOnlineForSyncHealth,
} from "./sync-health-state";
import { logSyncStatusErrors } from "./powersync-sync-error-logger";

async function resolveAuthenticatedUserId(): Promise<string> {
    const authStore = useAuthStore();
    const existing = authStore.user?.id;
    if (existing !== undefined && existing !== null) {
        return String(existing);
    }

    const session = await fetchCurrentSession();
    const u = session.user as { id?: string | number } | null | undefined;
    if (
        !session.isAuthenticated ||
        u == null ||
        u.id === undefined ||
        u.id === null
    ) {
        throw new Error("Missing authenticated user id.");
    }

    return String(u.id);
}

function applyReadinessFromStatus(status: SyncStatus): void {
    if (isUserScopePrioritySynced(status)) {
        runtimeState.initialUserScopeSyncComplete.value = true;
    }
    if (isProgramScopePrioritySynced(status)) {
        runtimeState.initialProgramScopeSyncComplete.value = true;
    }
}

function handlePowerSyncStatusChanged(status: SyncStatus): void {
    applySyncHealthFromStatus(status);
    applyReadinessFromStatus(status);
    logSyncStatusErrors(status);

    const uploadError = status.dataFlowStatus?.uploadError;
    const formatted = formatPowerSyncUploadError(uploadError);
    runtimeState.outboxCommitError.value = resolveOutboxCommitError(
        uploadError,
        formatted,
    );
    void refreshOutboxSnapshot();
}

function applyCurrentPowerSyncStatus(db: PowerSyncDatabase): void {
    handlePowerSyncStatusChanged(db.currentStatus);
}

export async function teardownAppPowerSync(): Promise<void> {
    if (runtimeState.bootstrapPromise !== null) {
        try {
            await runtimeState.bootstrapPromise;
        } catch {
            // Bootstrap may have failed; still tear down partial state.
        }
    }

    runtimeState.setBootstrapPromise(null);
    runtimeState.hasBootstrappedCollection.value = false;
    runtimeState.initialUserScopeSyncComplete.value = false;
    runtimeState.initialProgramScopeSyncComplete.value = false;
    runtimeState.setPowerSyncConnectorConnected(false);
    runtimeState.currentUserIdRef.value = "";

    detachAllPowerSyncStreams();

    runtimeState.powerSyncStatusUnsubscribe?.();
    runtimeState.setPowerSyncStatusUnsubscribe(null);

    const dbToClose = runtimeState.powerSyncDbRef.value;
    runtimeState.powerSyncDbRef.value = null;
    if (dbToClose) {
        try {
            await dbToClose.close();
        } catch (closeError) {
            console.error("PowerSync close failed during teardown:", closeError);
        }
    }

    for (const ref of Object.values(runtimeState.collectionRefs)) {
        ref.value = null;
    }

    resetSyncHealthSnapshot();
    runtimeState.errorMessage.value = "";
    runtimeState.outboxCommitError.value = "";
    runtimeState.outboxPendingCount.value = 0;
}

export async function bootstrapAppPowerSync(): Promise<void> {
    trackBrowserOnlineForSyncHealth();

    const authenticatedUserId = await resolveAuthenticatedUserId();

    if (
        runtimeState.hasBootstrappedCollection.value &&
        runtimeState.powerSyncDbRef.value &&
        runtimeState.currentUserIdRef.value === authenticatedUserId
    ) {
        runtimeState.errorMessage.value = "";
        publishSyncHealthSnapshot();
        applyCurrentPowerSyncStatus(runtimeState.powerSyncDbRef.value);
        return;
    }

    if (runtimeState.powerSyncDbRef.value !== null) {
        await teardownAppPowerSync();
    }

    if (runtimeState.bootstrapPromise !== null) {
        await runtimeState.bootstrapPromise;
        return;
    }

    const promise = (async () => {
        try {
            resetSyncHealthSnapshot();
            trackBrowserOnlineForSyncHealth();
            runtimeState.setPowerSyncConnectorConnected(false);
            runtimeState.initialUserScopeSyncComplete.value = false;
            runtimeState.initialProgramScopeSyncComplete.value = false;
            runtimeState.currentUserIdRef.value = authenticatedUserId;

            const db = new PowerSyncDatabase({
                schema: appPowerSyncSchema,
                database: { dbFilename: runtimeState.DB_FILENAME },
                ...(import.meta.env.DEV
                    ? { flags: { useWebWorker: false } }
                    : {}),
            });

            await db.init();

            runtimeState.powerSyncDbRef.value = db;

            runtimeState.setPowerSyncStatusUnsubscribe(
                db.registerListener({
                    statusChanged: handlePowerSyncStatusChanged,
                }),
            );

            wirePowerSyncCollections(db);

            const connector = createAppPowerSyncConnector();

            await db.connect(connector);

            await attachUserScopeStream(db);

            applyCurrentPowerSyncStatus(db);

            runtimeState.setPowerSyncConnectorConnected(true);

            attachProgramScopeStreamSubscription();

            runtimeState.hasBootstrappedCollection.value = true;
            runtimeState.errorMessage.value = "";
            runtimeState.persistenceUnavailable.value = false;
            publishSyncHealthSnapshot();
            applyCurrentPowerSyncStatus(db);
            await refreshOutboxSnapshot();
        } catch (error) {
            console.error("PowerSync bootstrap failed:", error);
            await teardownAppPowerSync();
            runtimeState.persistenceUnavailable.value = true;
            runtimeState.errorMessage.value =
                error instanceof Error
                    ? error.message
                    : runtimeState.loadFailedMessage;
            markSyncHealthUnavailable(runtimeState.errorMessage.value);
        } finally {
            runtimeState.isLoading.value = false;
        }
    })();

    runtimeState.setBootstrapPromise(promise);
    await promise;
}
