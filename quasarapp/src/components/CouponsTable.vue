<template>
    <BasicModelTable v-if="!coupons.isLoading" :resourceStore="coupons" :columns="columns" :filters="filters" />
</template>

<script>
    import { useCoupons } from "src/store/coupons";
    import { computed, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "./templates/BasicModelTable.vue";
    import { usePromotions } from "src/store/promotions";
    import { formatBool } from "src/utilities/formatters";
    export default {
        components: { BasicModelTable },
        props: {
            client_id: Number,
        },
        emits: ["updated"],
        // name: 'ComponentName',
        setup(props) {
            const { t } = useI18n();
            const coupons = useCoupons();
            const promotions = usePromotions();

            onMounted(() => {
                props.client_id ? coupons.getIndex({ client_id: props.client_id }) : coupons.getIndex();
                promotions.getIndexDebounce();
            });
            return {
                t,
                coupons,
                filters: computed(() => {
                    if (props.client_id)
                        return {
                            client_id: {
                                path: "client_id",
                                value: props.client_id,
                            },
                        };
                    return {};
                }),
                columns: [
                    {
                        name: "promotion",
                        label: t("promotion"),
                        field: (row) => row.promotion.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "value",
                        label: t("value"),
                        field: (row) => row.promotion.displayValue,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "is_on_invoice_total",
                        label: t("is_on_invoice_total"),
                        field: (row) => row.promotion.is_on_invoice_total,
                        align: "left",
                        filter: "boolean",
                        required: true,
                        format: formatBool,
                    },
                ],
            };
        },
    };
</script>
