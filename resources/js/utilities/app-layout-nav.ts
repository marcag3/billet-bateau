import { computed, inject, provide, type InjectionKey, type Ref } from 'vue';

/**
 * `id` of the main nav mount node inside the app drawer; Teleport targets this selector.
 * Must match the element in [AppLayout.vue](resources/js/layouts/AppLayout.vue).
 */
export const APP_PROGRAM_MAIN_NAV_TELEPORT_ID = 'app-program-main-nav' as const;

export const appProgramMainNavTargetKey: InjectionKey<
    Ref<HTMLElement | null>
> = Symbol('appProgramMainNavTarget');

export function provideAppProgramMainNavTarget(
    target: Ref<HTMLElement | null>,
): void {
    provide(appProgramMainNavTargetKey, target);
}

/**
 * Teleport into the app drawer main nav slot when the mount node exists.
 * Uses a provided element ref so nav survives drawer `v-if` / post-update remounts.
 */
export function useAppProgramMainNavTeleport() {
    const target = inject(appProgramMainNavTargetKey, null);

    const teleportDisabled = computed(() => (target?.value ?? null) == null);

    const teleportTargetKey = computed(() =>
        target?.value != null ? 'ready' : 'pending',
    );

    return {
        teleportDisabled,
        teleportTargetKey,
        teleportTo: computed(() => target?.value ?? null),
    };
}
