<template>
    <BasicModelTable :resourceStore="boatCategories" :visibleColumns="visibleColumns" :columns="columns" />
</template>

<script>
    import { useBoatCategories } from "src/store/boatCategories";
    import { defineComponent, ref, onMounted, computed } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable";
    import { useQuasar } from "quasar";
    import { useActivities } from "src/store/activities";

    export default defineComponent({
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const boatCategories = useBoatCategories();
            const $q = useQuasar();
            const activities = useActivities();

            onMounted(() => {
                boatCategories.getIndex();
                activities.getIndex();
            });

            return {
                t,
                boatCategories,

                visibleColumns: computed(() =>
                    $q.screen.gt.xs
                        ? ["name", "total_capacity", "teen_capacity", "child_capacity", "minimum_booking_person"]
                        : []
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
                        name: "total_capacity",
                        label: t("total_capacity"),
                        field: (row) => row.total_capacity,
                        align: "left",
                        filter: "number",
                        required: true,
                    },
                    {
                        name: "teen_capacity",
                        label: t("teen_capacity"),
                        field: (row) => row.teen_capacity,
                        align: "left",
                        filter: "number",
                        required: false,
                    },
                    {
                        name: "child_capacity",
                        label: t("child_capacity"),
                        field: (row) => row.child_capacity,
                        align: "left",
                        filter: "number",
                        required: false,
                    },
                    {
                        name: "minimum_booking_person",
                        label: t("minimum_booking_person"),
                        field: (row) => row.minimum_booking_person,
                        align: "left",
                        filter: "number",
                        required: false,
                    },
                ]),
            };
        },
    });
</script>
