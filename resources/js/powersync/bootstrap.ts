import { PowerSyncDatabase } from "@powersync/web";
import { fetchCurrentSession } from "../models/auth.api";
import { useAuthStore } from "../store/auth.store";
import { createAppPowerSyncConnector } from "../services/powersync.connector";
import { appPowerSyncSchema } from "./app.powersync-schema";
import { wirePowerSyncCollections } from "./collections.registry";
import {
    formatPowerSyncUploadError,
    isBenignPowerSyncUploadFailure,
    refreshOutboxSnapshot,
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

export async function bootstrapAppPowerSync(): Promise<void> {
    if (
        runtimeState.hasBootstrappedCollection.value &&
        runtimeState.powerSyncDbRef.value
    ) {
        runtimeState.errorMessage.value = "";
        runtimeState.initialUserScopeSyncComplete.value = true;
        if (isProgramScopePrioritySynced(runtimeState.powerSyncDbRef.value.currentStatus)) {
            runtimeState.initialProgramScopeSyncComplete.value = true;
        }
        return;
    }

    if (runtimeState.bootstrapPromise !== null) {
        await runtimeState.bootstrapPromise;
        return;
    }

    const promise = (async () => {
        try {
            runtimeState.setPowerSyncConnectorConnected(false);
            runtimeState.initialUserScopeSyncComplete.value = false;
            runtimeState.initialProgramScopeSyncComplete.value = false;
            runtimeState.currentUserIdRef.value =
                await resolveAuthenticatedUserId();

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
                    statusChanged: (status: SyncStatus) => {
                        if (isUserScopePrioritySynced(status)) {
                            runtimeState.initialUserScopeSyncComplete.value = true;
                        }
                        if (isProgramScopePrioritySynced(status)) {
                            runtimeState.initialProgramScopeSyncComplete.value = true;
                        }
                        const uploadError = status.dataFlowStatus?.uploadError;
                        const formatted = formatPowerSyncUploadError(uploadError);
                        runtimeState.outboxCommitError.value =
                            isBenignPowerSyncUploadFailure(
                                uploadError,
                                formatted,
                            ) || formatted.length === 0
                                ? ""
                                : formatted;
                        void refreshOutboxSnapshot();
                    },
                }),
            );

            wirePowerSyncCollections(db);

            const connector = createAppPowerSyncConnector();

            await db.connect(connector);

            await attachUserScopeStream(db);

            if (isUserScopePrioritySynced(db.currentStatus)) {
                runtimeState.initialUserScopeSyncComplete.value = true;
            }
            if (isProgramScopePrioritySynced(db.currentStatus)) {
                runtimeState.initialProgramScopeSyncComplete.value = true;
            }

            runtimeState.setPowerSyncConnectorConnected(true);

            attachProgramScopeStreamSubscription();

            runtimeState.hasBootstrappedCollection.value = true;
            runtimeState.errorMessage.value = "";
            runtimeState.persistenceUnavailable.value = false;
            await refreshOutboxSnapshot();
        } catch (error) {
            console.error("PowerSync bootstrap failed:", error);
            runtimeState.setBootstrapPromise(null);
            runtimeState.hasBootstrappedCollection.value = false;
            runtimeState.initialUserScopeSyncComplete.value = false;
            runtimeState.initialProgramScopeSyncComplete.value = false;
            runtimeState.setPowerSyncConnectorConnected(false);

            detachAllPowerSyncStreams();

            runtimeState.powerSyncStatusUnsubscribe?.();
            runtimeState.setPowerSyncStatusUnsubscribe(null);

            const dbToClose = runtimeState.powerSyncDbRef.value;
            runtimeState.powerSyncDbRef.value = null;
            if (dbToClose) {
                try {
                    await dbToClose.close();
                } catch (closeError) {
                    console.error(
                        "PowerSync close failed during bootstrap recovery:",
                        closeError,
                    );
                }
            }
            for (const ref of Object.values(runtimeState.collectionRefs)) {
                ref.value = null;
            }
            runtimeState.persistenceUnavailable.value = true;
            runtimeState.errorMessage.value =
                error instanceof Error
                    ? error.message
                    : runtimeState.loadFailedMessage;
        } finally {
            runtimeState.isLoading.value = false;
        }
    })();

    runtimeState.setBootstrapPromise(promise);
    await promise;
}
