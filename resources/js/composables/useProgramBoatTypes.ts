import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

/**
 * Live boat types for a program (PowerSync / TanStack DB).
 */
export function useProgramBoatTypes(programId: MaybeRefOrGetter<string>) {
    const boatTypesCollection = getAppPowerSyncContext().collections.boat_types;
    const programIdTrimmed = computed(() =>
        String(toValue(programId) ?? '').trim(),
    );

    return useLiveQuery(
        (queryBuilder) => {
            const col = boatTypesCollection.value;
            const pid = programIdTrimmed.value;
            if (!col || pid.length === 0) {
                return undefined;
            }
            return queryBuilder
                .from({ bt: col })
                .where(({ bt }) => eq(bt.program_id, pid));
        },
        [boatTypesCollection, programIdTrimmed],
    );
}
