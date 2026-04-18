<template>
    <BasicModelTable :resourceStore="routes" :visibleColumns="visibleColumns" :columns="columns" />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { computed, onMounted, ref } from "vue";
    import { useQuasar } from "quasar";
    import { useRoutes } from "../../store/routes";
    import { useStops } from "../../store/stops";
    import BasicModelTable from "src/components/templates/BasicModelTable.vue";
    import { useAreas } from "src/store/areas";

    export default {
        name: "Routes",
        components: {
            BasicModelTable,
        },
        setup() {
            const { t } = useI18n();
            const $q = useQuasar();
            const routes = useRoutes();
            const stops = useStops();
            const areas = useAreas();
            const route = ref({});

            onMounted(() => {
                routes.getIndexDebounce();
                stops.getIndexDebounce();
                areas.getIndexDebounce();
            });

            return {
                t,
                routes,
                route,
                visibleColumns: computed(() => ($q.screen.gt.xs ? ["name", "duration", "firstStop", "area_id"] : [])),

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
                        name: "duration",
                        label: t("duration"),
                        field: (row) => row.duration,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "firstStop",
                        label: t("first_stop"),
                        field: (row) => (row.route_stops[0] ? row.route_stops[0].stop.name : ""),
                        align: "left",
                        filter: "text",
                        required: false,
                    },
                    {
                        name: "area_id",
                        label: t("area"),
                        field: (row) => row.area.name,
                        align: "left",
                        filter: "text",
                        required: false,
                    },
                ]),
            };
        },
    };
</script>
