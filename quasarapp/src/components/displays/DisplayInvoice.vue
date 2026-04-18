<template>
    <div>
        <q-markup-table wrap-cells flat square>
            <thead class="text-left">
                <th>
                    {{ t("item") }}
                </th>
                <th>
                    {{ t("number") }}
                </th>
                <th>
                    {{ t("price") }}
                </th>
                <th v-if="showActions" class="text-right">
                    {{ t("actions") }}
                </th>
            </thead>
            <tbody>
                <tr
                    class="text-left"
                    v-for="invoiceItem in invoice.invoice_items"
                    :key="invoiceItem.id"
                    :class="{ 'bg-grey-4': invoiceItem.id % 2 === 0 }"
                >
                    <td>
                        {{ invoiceItem.itemable.displayName }}
                    </td>
                    <td>
                        {{ invoiceItem.number_of_items }}
                    </td>
                    <td class="text-no-wrap">
                        {{ invoiceItem.formatMoney("multiplePrice") }}
                    </td>
                    <td v-if="showActions" class="text-right">
                        <q-btn
                            round
                            icon="fas fa-minus"
                            size="xs"
                            color="negative"
                            @click="$emit('removeInvoiceItem', invoiceItem.itemable)"
                        />
                    </td>
                </tr>
            </tbody>
        </q-markup-table>
        <q-list>
            <q-item style="border-top: 1px solid rgba(0, 0, 0, 0.12)" class="text-weight-bold text-right">
                Total: {{ invoice.formatMoney("total") }}
            </q-item>
            <q-item
                v-if="showActions && invoice.isDraft"
                class="bg-positive text-white text-weight-bold items-center"
                clickable
                :to="nextStep()"
            >
                <q-icon left name="fas fa-sign-out-alt" />
                {{ t("checkout") }}
            </q-item>
        </q-list>
    </div>
</template>

<script>
    import { onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import { useAppState } from "src/store/appState";
    import { useProducts } from "src/store/products";
    import { useSubscriptions } from "src/store/subscriptions";
    import { usePromotions } from "src/store/promotions";

    export default {
        // name: 'ComponentName',
        props: {
            invoice: Object,
            serverValidations: Object,
            showActions: Boolean,
        },
        emits: ["removeInvoiceItem"],
        setup() {
            const { t } = useI18n();
            const appState = useAppState();
            const products = useProducts();
            const subscriptions = useSubscriptions();
            const promotions = usePromotions();
            onMounted(() => {
                products.getIndexDebounce();
                subscriptions.getIndexDebounce();
                promotions.getIndexDebounce();
            });
            return {
                t,
                nextStep() {
                    return appState.nextStep("magasin");
                },
            };
        },
    };
</script>
