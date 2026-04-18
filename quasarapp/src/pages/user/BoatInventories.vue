<template>
    <BasicModelTable :resourceStore="boatInventories" :visibleColumns="visibleColumns" :columns="columns" />
</template>

<script>
    import { useBoatInventories } from "src/store/boatInventories";
    import { defineComponent, ref, onMounted, computed } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable";
    import { useQuasar } from "quasar";
    import { useBoatCategories } from "src/store/boatCategories";

    export default defineComponent({
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const boatInventories = useBoatInventories();
            const $q = useQuasar();
            const boatCategories = useBoatCategories();

            onMounted(() => {
                boatInventories.getIndex();
                boatCategories.getIndex();
            });

            return {
                t,
                boatInventories,
                visibleColumns: computed(() => ($q.screen.gt.xs ? ["description_fr", "description_en"] : [])),
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
                        name: "boat_category_id",
                        label: t("boat_category_id"),
                        field: (row) => row.boatCategory.displayName,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "quantity",
                        label: t("quantity"),
                        field: (row) => row.quantity,
                        align: "left",
                        filter: "number",
                        required: true,
                    },
                ]),
            };
        },
    });
</script>
