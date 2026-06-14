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
    initialProgramScopeSyncComplete,
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
import { syncHealthSnapshot } from "./sync-health-state";
import type { SyncHealthSnapshot } from "./sync-health";
import { useSyncHealth } from "../composables/useSyncHealth";

export type AppPowerSyncContext = {
    collections: PowerSyncCollectionRefs;
    activeProgramIdRef: Ref<string>;
    setActiveProgramId: typeof setActiveProgramId;
    getActiveProgramIdRef: typeof getActiveProgramIdRef;
    bootstrapAppPowerSync: typeof bootstrapAppPowerSync;
    refreshOutboxSnapshot: typeof refreshOutboxSnapshot;
    useAppPowerSyncOutbox: typeof useAppPowerSyncOutbox;
    useSyncHealth: typeof useSyncHealth;
    syncHealthSnapshot: ShallowRef<SyncHealthSnapshot>;
    isLoading: Ref<boolean>;
    errorMessage: Ref<string>;
    programsDeserializationError: Ref<unknown>;
    hasBootstrappedCollection: Ref<boolean>;
    initialUserScopeSyncComplete: Ref<boolean>;
    initialProgramScopeSyncComplete: Ref<boolean>;
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
    useSyncHealth,
    syncHealthSnapshot,
    isLoading,
    errorMessage,
    programsDeserializationError,
    hasBootstrappedCollection,
    initialUserScopeSyncComplete,
    initialProgramScopeSyncComplete,
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
