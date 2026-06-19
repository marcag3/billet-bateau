import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import type { MaybeRefOrGetter } from 'vue';
import { computed, toValue } from 'vue';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import type { ProgramUserOutput } from '../powersync/program-user.collection';
import {
    isProgramOwner,
    resolveCurrentProgramMembershipRole,
} from '../utilities/program-membership';

/**
 * Live membership role for the authenticated user on a program (PowerSync / TanStack DB).
 */
export function useCurrentProgramMembershipRole(
    programId: MaybeRefOrGetter<string>,
) {
    const powersync = getAppPowerSyncContext();
    const programUsersCollection = powersync.collections.program_user;
    const currentUserId = powersync.currentUserIdRef;

    const programIdTrimmed = computed(() =>
        String(toValue(programId) ?? '').trim(),
    );

    const { data: programMemberships } = useLiveQuery(
        (queryBuilder) => {
            const col = programUsersCollection.value;
            const pid = programIdTrimmed.value;
            if (!col || pid.length === 0) {
                return undefined;
            }

            return queryBuilder
                .from({ m: col })
                .where(({ m }) => eq(m.program_id, pid));
        },
        [programUsersCollection, programIdTrimmed],
    );

    const role = computed((): string | null =>
        resolveCurrentProgramMembershipRole(
            (programMemberships.value ?? []) as ProgramUserOutput[],
            programIdTrimmed.value,
            currentUserId.value,
        ),
    );

    const isOwner = computed(() => isProgramOwner(role.value));

    return { role, isOwner, programMemberships };
}
