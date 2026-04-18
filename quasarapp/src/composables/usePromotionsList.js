import { usePromotions } from "src/store/promotions";
import { operators } from "src/utilities/helpers";
import { computed, onMounted } from "vue";

export default function usePromotionsList(client, invoice) {
    const promotions = usePromotions();
    onMounted(() => {
        promotions.getIndexDebounce();
    });

    const addedPromotions = computed(() => {
        return invoice.value.invoice_items
            .filter((item) => item.itemable_type === "App\\Subscription")
            .map((item) => item.itemable.add_promotion_id);
    });

    const availablePromotionsIds = computed(() => {
        let promotions = [...client.value.promotions_ids, ...addedPromotions.value];

        //remove client's promotions added to invoice
        invoice.value.invoice_items
            .filter((item) => item.itemable_type === "App\\Promotion")
            .forEach((item) => {
                if (!item.itemable.is_on_client) return;
                for (let i = 0; i < item.number_of_items; i++) {
                    let index = promotions.indexOf(item.itemable_id);
                    promotions.splice(index, 1);
                }
            });
        return promotions;
    });
    const promotionsFilters = computed(() => {
        return {
            ownedByClient: {
                filterFunction: (promotion) => {
                    if (!promotion.is_on_client) return true;
                    if (!operators.in(availablePromotionsIds.value, promotion.id)) return false;
                    return true;
                },
            },
            possibleProducts: {
                path: "products_id",
                operator: "inOrNull",
                value: invoice.value.invoice_items
                    .filter(({ itemable_type }) => itemable_type === "App\\Product")
                    .map(({ itemable_id }) => itemable_id),
            },
            atLeastOneProduct: {
                filterFunction: (promotion) => {
                    if (!promotion.products_id || promotion.products_id.length === 0)
                        return (
                            invoice.value.invoice_items.filter(({ itemable_type }) => itemable_type === "App\\Product")
                                .length > 0
                        );
                },
            },
        };
    });
    const promotionsList = computed(() => promotions.filteredList(promotionsFilters.value));

    return {
        promotionsList,
    };
}
