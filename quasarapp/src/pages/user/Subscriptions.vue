<template>
    <BasicModelTable :resourceStore="subscriptions" :visibleColumns="visibleColumns" :columns="columns" />
</template>

<script>
    import { useSubscriptions } from "src/store/subscriptions";
    import { defineComponent, ref, onMounted, computed } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable";
    import { useQuasar } from "quasar";

    export default defineComponent({
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const subscriptions = useSubscriptions();
            const $q = useQuasar();

            onMounted(() => {
                subscriptions.getIndex();
            });

            return {
                t,
                subscriptions,

                visibleColumns: computed(() => ($q.screen.gt.xs ? ["available_points_of_sale_ids"] : [])),
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
                        field: (row) => row.displayDuration,
                        align: "left",
                        filter: "text",
                        required: true,
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
    });
</script>
