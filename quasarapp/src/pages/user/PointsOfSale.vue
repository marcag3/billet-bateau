<template>
    <BasicModelTable :resourceStore="pointsOfSale" :columns="columns" />
</template>

<script>
    import { usePointsOfSale } from "src/store/pointsOfSale";
    import { defineComponent, ref, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable";
    import { useAreas } from "src/store/areas";
    import { formatBool } from "src/utilities/formatters";

    export default defineComponent({
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const pointsOfSale = usePointsOfSale();
            const areas = useAreas();

            onMounted(() => {
                pointsOfSale.getIndexDebounce();
                areas.getIndexDebounce();
            });

            return {
                t,
                pointsOfSale,
                columns: ref([
                    {
                        name: "name",
                        label: t("name"),
                        field: "name",
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "is_for_client",
                        label: t("is_for_client"),
                        field: "is_for_client",
                        align: "left",
                        filter: "boolean",
                        required: true,
                        format: formatBool,
                    },
                    {
                        name: "area_id",
                        label: t("area"),
                        field: (row) => row.area.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                ]),
            };
        },
    });
</script>
