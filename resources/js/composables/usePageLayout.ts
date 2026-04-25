import { onUnmounted } from 'vue';
import { useAppLayoutStore, type AppPageLayoutRuntimeOverrides } from '../store/app-layout.store';

/**
 * Optional per-page layout overrides (runtime), beyond what program context layouts set.
 * Clears on component unmount when overrides are applied.
 */
export function usePageLayout(overrides?: AppPageLayoutRuntimeOverrides) {
    const store = useAppLayoutStore();
    if (overrides == null || Object.keys(overrides).length === 0) {
        return;
    }
    store.setPageLayoutOverrides(overrides);
    onUnmounted(() => {
        store.clearPageLayoutOverrides();
    });
}
