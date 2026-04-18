import { useAppState } from "src/store/appState";
import { useSubscriptions } from "src/store/subscriptions";
import { computed, onMounted } from "vue";

export default function useSubscriptionsList() {
    const appState = useAppState();
    const subscriptions = useSubscriptions();
    onMounted(() => {
        subscriptions.getIndexDebounce();
    });
    const subscriptionsFilters = computed(() => {
        return {
            pointOfSale: {
                path: "available_points_of_sale_ids",
                operator: "in",
                value: appState.thisPointOfSaleId,
            },
        };
    });
    const subscriptionsList = computed(() => subscriptions.filteredList(subscriptionsFilters.value));

    return {
        subscriptionsList,
    };
}
