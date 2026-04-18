import { useAppState } from "src/store/appState";
import { useProducts } from "src/store/products";
import { operators } from "src/utilities/helpers";
import { computed, onMounted } from "vue";

export default function useProductsList(client, invoice) {
    const products = useProducts();
    const appState = useAppState();
    onMounted(() => {
        products.getIndexDebounce();
    });
    const productsFilters = computed(() => {
        return {
            rental: {
                path: "is_rental",
                operator: "in",
                value: client.value.is_guided ? [true, false] : false,
            },
            requiredSubscriptions: {
                path: "required_subscription_id",
                operator: "inOrNull",
                value: Object.values(client.value.subscriptions_ids).concat(invoice.value.subscriptionsIds),
            },
            pointOfSale: {
                path: "available_points_of_sale_ids",
                operator: "in",
                value: appState.thisPointOfSaleId,
            },
        };
    });
    const productsListWithReplaced = computed(() => products.filteredList(productsFilters.value));
    const replacedProductsId = computed(() => [
        ...productsListWithReplaced.value.reduce((replacedIdSet, product) => {
            for (let index in product.replace_products_id) {
                replacedIdSet.add(product.replace_products_id[index]);
            }
            return replacedIdSet;
        }, new Set()),
    ]);
    const productsList = computed(() =>
        productsListWithReplaced.value.filter(({ id }) => operators.notIn(id, replacedProductsId.value))
    );

    return {
        productsList,
    };
}
