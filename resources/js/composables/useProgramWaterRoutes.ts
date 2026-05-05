import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

/**
 * Live water routes for a program (PowerSync / TanStack DB).
 */
export function useProgramWaterRoutes(programId: MaybeRefOrGetter<string>) {
    const waterRoutesCollection =
        getAppPowerSyncContext().collections.water_routes;
    const programIdTrimmed = computed(() =>
        String(toValue(programId) ?? '').trim(),
    );

    return useLiveQuery(
        (queryBuilder) => {
            const col = waterRoutesCollection.value;
            const pid = programIdTrimmed.value;
            if (!col || pid.length === 0) {
                return undefined;
            }
            return queryBuilder
                .from({ wr: col })
                .where(({ wr }) => eq(wr.program_id, pid));
        },
        [waterRoutesCollection, programIdTrimmed],
    );
}
