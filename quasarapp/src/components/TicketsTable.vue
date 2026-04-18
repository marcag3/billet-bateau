<template>
    <BasicModelTable v-if="!tickets.isLoading" :resourceStore="tickets" :columns="columns" :filters="filters" />
</template>

<script>
    import { useTickets } from "src/store/tickets";
    import { computed, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "./templates/BasicModelTable.vue";
    import { useProducts } from "src/store/products";
    import { useBoatCategories } from "src/store/boatCategories";
    import { formatBool } from "src/utilities/formatters";
    export default {
        components: { BasicModelTable },
        props: {
            client_id: Number,
        },
        // name: 'ComponentName',
        emits: ["updated"],
        setup(props) {
            const { t } = useI18n();
            const tickets = useTickets();
            const products = useProducts();
            const boatCategories = useBoatCategories();

            onMounted(() => {
                props.client_id
                    ? tickets.getIndex({ client_id: props.client_id, withUnavailable: true })
                    : tickets.getIndex({ withUnavailable: true });
                products.getIndexDebounce();
                boatCategories.getIndexDebounce();
            });
            return {
                t,
                tickets,
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
                        name: "product",
                        label: t("product"),
                        field: (row) => row.product.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "duration",
                        label: t("duration"),
                        field: (row) => row.product.formatDuration("duration", "minutes"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "boatCategory",
                        label: t("boatCategory"),
                        field: (row) => row.product.boatCategory.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "max_passenger",
                        label: t("max_passenger"),
                        field: (row) => row.product.displayMaxPassenger,
                        align: "left",
                        filter: "number",
                        required: true,
                    },
                    {
                        name: "guided",
                        label: t("guided"),
                        field: (row) => row.product.is_guided,
                        align: "left",
                        filter: "boolean",
                        required: true,
                        format: formatBool,
                    },
                    {
                        name: "remainingUses",
                        label: t("remaining_uses"),
                        field: (row) => row.remaining_uses,
                        align: "left",
                        filter: "number",
                        required: true,
                    },
                ],
            };
        },
    };
</script>
