<template>
    <BasicModelTable :resourceStore="promotions" :visibleColumns="visibleColumns" :columns="columns" />
</template>

<script>
    import { usePromotions } from "src/store/promotions";
    import { defineComponent, ref, onMounted, computed } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable";
    import { useQuasar } from "quasar";
    import { useProducts } from "src/store/products";
    import { formatBool } from "src/utilities/formatters";

    export default defineComponent({
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const promotions = usePromotions();
            const $q = useQuasar();
            const products = useProducts();

            onMounted(() => {
                promotions.getIndex();
                products.getIndex();
            });

            return {
                t,
                promotions,
                visibleColumns: computed(() => ($q.screen.gt.xs ? ["is_on_client"] : [])),
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
                        name: "discount",
                        label: t("discount"),
                        field: (row) => row.displayValue,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "products_id",
                        label: t("products_id"),
                        field: (row) => String(row.displayProducts),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "is_on_client",
                        label: t("is_on_client"),
                        field: "is_on_client",
                        align: "left",
                        filter: "boolean",
                        required: false,
                        format: formatBool,
                    },
                ]),
            };
        },
    });
</script>
