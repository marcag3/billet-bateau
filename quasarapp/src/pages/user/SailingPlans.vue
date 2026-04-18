<template>
    <BasicModelTable :resourceStore="sailingPlans" :visibleColumns="visibleColumns" :columns="columns" />
</template>

<script>
    import { useSailingPlans } from "src/store/sailingPlans";
    import { defineComponent, ref, onMounted, computed } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "src/components/templates/BasicModelTable";
    import { useQuasar } from "quasar";
    import { useRoutes } from "src/store/routes";
    import { useBoatCategories } from "src/store/boatCategories";
    import { useTrips } from "src/store/trips";

    export default defineComponent({
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const sailingPlans = useSailingPlans();
            const $q = useQuasar();
            const routes = useRoutes();
            const boatCategories = useBoatCategories();
            const trips = useTrips();

            onMounted(() => {
                sailingPlans.getIndex();
                routes.getIndex();
                boatCategories.getIndex();
                trips.getIndex();
            });

            return {
                t,
                sailingPlans,

                visibleColumns: computed(() => ($q.screen.gt.xs ? ["route"] : [])),
                columns: ref([
                    {
                        name: "departureDate",
                        label: t("departure_date"),
                        field: (row) => row.departureDate,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "departure_time",
                        label: t("departure_time"),
                        field: (row) => row.departure_time,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "status",
                        label: t("status"),
                        field: (row) => row.formatOption("status"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "arrival_time",
                        label: t("arrival_time"),
                        field: (row) => row.arrival_time,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "boatCategory",
                        label: t("boatCategory"),
                        field: (row) => row.boatCategory.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "number_of_passengers",
                        label: t("number_of_passengers"),
                        field: (row) => row.number_of_passengers,
                        align: "left",
                        filter: "number",
                        required: true,
                    },
                    {
                        name: "route",
                        label: t("route"),
                        field: (row) => row.route.name,
                        align: "left",
                        filter: "text",
                        required: false,
                    },
                ]),
            };
        },
    });
</script>
