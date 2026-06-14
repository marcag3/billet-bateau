import type { Ref, ShallowRef } from "vue";
import type { PowerSyncDatabase } from "@powersync/web";
import { bootstrapAppPowerSync } from "./bootstrap";
import { refreshOutboxSnapshot, useAppPowerSyncOutbox } from "./outbox";
import {
    activeProgramIdRef,
    collectionRefs,
    currentUserIdRef,
    errorMessage,
    hasBootstrappedCollection,
    initialUserScopeSyncComplete,
    isLoading,
    outboxCommitError,
    outboxPendingCount,
    persistenceLimitedMessage,
    persistenceUnavailable,
    powerSyncDbRef,
    programsDeserializationError,
    setActiveProgramId,
    getActiveProgramIdRef,
    type PowerSyncCollectionRefs,
} from "./powersync-runtime-state";

export type AppPowerSyncContext = {
    collections: PowerSyncCollectionRefs;
    activeProgramIdRef: Ref<string>;
    setActiveProgramId: typeof setActiveProgramId;
    getActiveProgramIdRef: typeof getActiveProgramIdRef;
    bootstrapAppPowerSync: typeof bootstrapAppPowerSync;
    refreshOutboxSnapshot: typeof refreshOutboxSnapshot;
    useAppPowerSyncOutbox: typeof useAppPowerSyncOutbox;
    isLoading: Ref<boolean>;
    errorMessage: Ref<string>;
    programsDeserializationError: Ref<unknown>;
    hasBootstrappedCollection: Ref<boolean>;
    initialUserScopeSyncComplete: Ref<boolean>;
    persistenceUnavailable: Ref<boolean>;
    persistenceLimitedMessage: typeof persistenceLimitedMessage;
    powerSyncDbRef: ShallowRef<PowerSyncDatabase | null>;
    currentUserIdRef: Ref<string>;
    outboxPendingCount: typeof outboxPendingCount;
    outboxCommitError: typeof outboxCommitError;
};

const appPowerSyncContext: AppPowerSyncContext = {
    collections: collectionRefs,
    activeProgramIdRef,
    setActiveProgramId,
    getActiveProgramIdRef,
    bootstrapAppPowerSync,
    refreshOutboxSnapshot,
    useAppPowerSyncOutbox,
    isLoading,
    errorMessage,
    programsDeserializationError,
    hasBootstrappedCollection,
    initialUserScopeSyncComplete,
    persistenceUnavailable,
    persistenceLimitedMessage,
    powerSyncDbRef,
    currentUserIdRef,
    outboxPendingCount,
    outboxCommitError,
};

export function getAppPowerSyncContext(): AppPowerSyncContext {
    return appPowerSyncContext;
}
