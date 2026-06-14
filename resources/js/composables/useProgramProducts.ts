import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import type { MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";

/**
 * Live products for a program (PowerSync / TanStack DB).
 */
export function useProgramProducts(programId: MaybeRefOrGetter<string>) {
    const productsCollection = getAppPowerSyncContext().collections.products;
    const programIdTrimmed = computed(() => String(toValue(programId) ?? "").trim());

    return useLiveQuery(
        (queryBuilder) => {
            const col = productsCollection.value;
            const pid = programIdTrimmed.value;
            if (!col || pid.length === 0) {
                return undefined;
            }
            return queryBuilder
                .from({ p: col })
                .where(({ p }) => eq(p.program_id, pid));
        },
        [productsCollection, programIdTrimmed],
    );
}
