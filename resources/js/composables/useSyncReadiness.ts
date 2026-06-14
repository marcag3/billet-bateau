import { computed, type Ref } from "vue";
import { useRoute } from "vue-router";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import { resolveRouteSyncStreams } from "../utilities/route-sync-streams";
import {
    contentLoadingI18nKeys,
    firstPendingSyncPhase,
    isBootstrapPending,
    isSyncContentPending,
    shouldShowSyncedEmptyState,
    type PowerSyncStream,
} from "../utilities/sync-readiness";

export type UseSyncReadinessOptions = {
    streams?: PowerSyncStream[];
    liveQueryLoading?: Ref<boolean>;
};

export function useSyncReadiness(options: UseSyncReadinessOptions = {}) {
    const route = useRoute();
    const powersync = getAppPowerSyncContext();

    const requiredStreams = computed(
        () => options.streams ?? resolveRouteSyncStreams(route.matched),
    );

    const readinessState = computed(() => ({
        hasBootstrapped: powersync.hasBootstrappedCollection.value,
        initialUserScopeSyncComplete:
            powersync.initialUserScopeSyncComplete.value,
        initialProgramScopeSyncComplete:
            powersync.initialProgramScopeSyncComplete.value,
    }));

    const liveQueryLoading = computed(
        () => options.liveQueryLoading?.value ?? false,
    );

    const isBootstrapping = computed(() =>
        isBootstrapPending(readinessState.value.hasBootstrapped),
    );

    const isContentPending = computed(() =>
        isSyncContentPending(
            requiredStreams.value,
            readinessState.value,
            liveQueryLoading.value,
        ),
    );

    const pendingPhase = computed(() =>
        firstPendingSyncPhase(
            requiredStreams.value,
            readinessState.value,
            liveQueryLoading.value,
        ),
    );

    const contentLoadingTitleKey = computed(
        () => contentLoadingI18nKeys(pendingPhase.value).titleKey,
    );

    const contentLoadingHintKey = computed(
        () => contentLoadingI18nKeys(pendingPhase.value).hintKey,
    );

    function shouldShowEmpty(isEmpty: boolean): boolean {
        return shouldShowSyncedEmptyState(
            readinessState.value,
            requiredStreams.value,
            liveQueryLoading.value,
            isEmpty,
        );
    }

    return {
        errorMessage: powersync.errorMessage,
        requiredStreams,
        isBootstrapping,
        isContentPending,
        pendingPhase,
        contentLoadingTitleKey,
        contentLoadingHintKey,
        shouldShowEmpty,
    };
}
