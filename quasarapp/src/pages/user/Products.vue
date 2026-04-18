<template>
    <BasicModelTable :resourceStore="products" :visibleColumns="visibleColumns" :columns="columns" />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable";
    import { useProducts } from "src/store/products";
    import { useQuasar } from "quasar";
    import { ref, onMounted, computed } from "vue";
    import { useBoatCategories } from "src/store/boatCategories";
    import { useSubscriptions } from "src/store/subscriptions";

    export default {
        // name: 'PageName',
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const products = useProducts();
            const boatCategories = useBoatCategories();
            const $q = useQuasar();
            const subscriptions = useSubscriptions();

            onMounted(() => {
                products.getIndex({ withUnavailable: true });
                boatCategories.getIndex();
                subscriptions.getIndex();
            });

            return {
                t,
                products,
                visibleColumns: computed(() =>
                    $q.screen.gt.xs ? ["boat_category", "max_passenger", "available_points_of_sale_ids"] : []
                ),
                columns: ref([
                    {
                        name: "name",
                        label: t("name"),
                        field: (row) => row.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "price",
                        label: t("price"),
                        field: (row) => row.formatMoney("price"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "duration",
                        label: t("duration"),
                        field: (row) => row.duration + " min",
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "boat_category",
                        label: t("boat_category"),
                        field: (row) => row.boatCategory.name,
                        align: "left",
                        filter: "text",
                        required: false,
                    },
                    {
                        name: "max_passenger",
                        label: t("max_passenger"),
                        field: (row) => row.max_passenger,
                        align: "left",
                        filter: "number",
                        required: false,
                    },
                    {
                        name: "available_points_of_sale_ids",
                        label: t("available_points_of_sale_ids"),
                        field: (row) => row.displayAvailable,
                        align: "left",
                        filter: "text",
                        required: false,
                    },
                ]),
            };
        },
    };
</script>
