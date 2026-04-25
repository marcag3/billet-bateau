import { computed, unref } from 'vue';

/**
 * Filters rows to the current user. Empty when user id is missing.
 * @param {import('vue').Ref<unknown[]> | import('vue').ComputedRef<unknown[]>} collectionRef
 * @param {import('vue').Ref<unknown> | (() => unknown)} userIdOrGetter User id, ref to id, or getter returning id.
 */
//TODO: We don't have user scoped rows
export function useUserScopedCollection(collectionRef, userIdOrGetter) {
    return computed(() => {
        const rows = unref(collectionRef) ?? [];
        const uid = typeof userIdOrGetter === 'function' ? userIdOrGetter() : unref(userIdOrGetter);
        if (uid === undefined || uid === null) {
            return [];
        }
        const s = String(uid);
        return rows.filter((row) => row != null && String(row.user_id) === s);
    });
}
