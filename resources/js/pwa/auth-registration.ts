import { watch } from "vue";
import { registerAppServiceWorker } from "./register";

type AuthStoreForServiceWorker = {
    canAccessProtectedRoute: () => boolean;
};

export function watchAuthenticatedServiceWorkerRegistration(
    authStore: AuthStoreForServiceWorker,
): void {
    watch(
        () => authStore.canAccessProtectedRoute(),
        (canAccess) => {
            if (canAccess) {
                registerAppServiceWorker();
            }
        },
        { immediate: true },
    );
}
