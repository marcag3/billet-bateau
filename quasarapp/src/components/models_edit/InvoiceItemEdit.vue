<template>
    <q-card-section class="q-pa-none">
        <!-- items list -->
        <NestedModelTable
            v-model="invoice.invoice_items"
            modelName="invoice_item"
            :columns="columns"
            @add="invoice.invoice_items.push(new InvoiceItem({ number_of_items: 1 }))"
        />
        <div class="row justify-center items-center">
            <p class="q-px-xl q-py-sm shadow-1 text-bold text-h6">
                {{ t("sub_total") + ": " + total }}
            </p>
        </div>
    </q-card-section>
</template>

<script>
    import { onMounted, ref, useAttrs, watch } from "vue";
    import NestedModelTable from "src/components/templates/NestedModelTable.vue";
    import { Invoice, InvoiceItem } from "src/store/invoices";
    import { useI18n } from "vue-i18n";
    import { useProducts } from "src/store/products";
    import { useSubscriptions } from "src/store/subscriptions";
    import { usePromotions } from "src/store/promotions";
    import { required } from "src/utilities/validators";
    import { useAppState } from "src/store/appState";
    export default {
        components: { NestedModelTable },
        // name: 'ComponentName',
        props: {
            invoice: Invoice,
        },
        setup(props) {
            const { t } = useI18n();
            const products = useProducts();
            const subscriptions = useSubscriptions();
            const promotions = usePromotions();
            const total = ref(props.invoice.formatMoney("calculatedTotal"));
            const appState = useAppState();

            watch(
                () => props.invoice.calculatedTotal,
                () => {
                    if (!props.invoice.calculatedTotal) return;
                    total.value = props.invoice.formatMoney("calculatedTotal");
                }
            );

            onMounted(() => {
                products.getIndexDebounce();
                subscriptions.getIndexDebounce();
                promotions.getIndexDebounce();
            });
            return {
                total,
                InvoiceItem,
                t,
                columns: [
                    {
                        name: "itemable",
                        label: t("itemable"),
                        component: "PolymorphicSelect",
                        icon: "fas fa-sleigh",
                        rules: { required },
                        attributes: {
                            models: [
                                {
                                    store: products,
                                    filters: {
                                        pointOfSale: {
                                            path: "available_points_of_sale_ids",
                                            operator: "inOrNull",
                                            value: appState.thisPointOfSaleId,
                                        },
                                    },
                                },
                                {
                                    store: subscriptions,
                                    filters: {
                                        pointOfSale: {
                                            path: "available_points_of_sale_ids",
                                            operator: "inOrNull",
                                            value: appState.thisPointOfSaleId,
                                        },
                                    },
                                },
                                { store: promotions },
                            ],
                        },
                        onChange: (invoiceItem) => {
                            const itemable = invoiceItem.itemable;
                            if (itemable === undefined) return;
                            invoiceItem.price = itemable.price;
                            invoiceItem.is_taxable = itemable.is_taxable;
                        },
                    },
                    {
                        name: "price",
                        label: t("unit_price"),
                        component: "MyInput",
                        icon: "fas fa-tag",
                        rules: { required },
                    },
                    {
                        name: "is_taxable",
                        label: t("is_taxable"),
                        component: "MyToggle",
                        icon: "fas fa-money-bill-wave-alt",
                        rules: { required },
                    },
                    {
                        name: "number_of_items",
                        label: t("number_of_items"),
                        component: "MyInput",
                        icon: "fas fa-cubes",
                        rules: { required },
                    },
                ],
            };
        },
    };
</script>
