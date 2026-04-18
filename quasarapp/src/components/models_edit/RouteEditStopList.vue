<template>
    <q-table
        :columns="columns"
        :rows="route_stops"
        hide-no-data
        :dense="$q.screen.lt.lg"
        :grid="$q.screen.lt.sm"
        table-header-class="bg-grey-3"
        :pagination="{ rowsPerPage: 30 }"
        wrap-cells
        flat
    >
        <template v-slot:top class="row justify-end">
            <!-- add/remove stops buttons -->
            <q-btn
                dense
                size="sm"
                class="q-mx-sm"
                flat
                color="primary"
                @click="
                    route_stops.push(
                        new RouteStop({
                            stop_sequence: route_stops.length + 1,
                            arrival_minutes: route_stops.length === 0 ? 0 : null,
                            stop_id: null,
                        })
                    )
                "
                :label="t('add_stop')"
                icon="fas fa-plus"
            />
            <q-btn
                dense
                size="sm"
                class="q-mx-sm"
                flat
                color="primary"
                :label="t('remove_stop')"
                icon="fas fa-minus"
                @click="route_stops.splice(-1)"
            />
        </template>

        <template v-slot:body="props">
            <RouteEditStop
                v-if="route_stops.length > 0"
                :props="props"
                display="row"
                @update:stopList="updateStopList"
            />
        </template>
        <template v-slot:item="props">
            <RouteEditStop
                v-if="route_stops.length > 0"
                :props="props"
                display="card"
                @update:stopList="updateStopList"
            />
        </template>
    </q-table>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { useStops } from "../../store/stops";
    import RouteEditStop from "components/models_edit/RouteEditStop";
    import { RouteStop } from "../../store/routes";
    export default {
        // name: 'ComponentName',
        props: {
            route_stops: Array,
        },
        emits: [],
        components: {
            RouteEditStop,
        },
        setup(props) {
            const { t } = useI18n();
            const stops = useStops();

            return {
                t,
                stops,
                RouteStop,
                columns: [
                    {
                        name: "arrival",
                        label: t("arrival"),
                        align: "left",
                    },
                    {
                        name: "stop",
                        label: t("stop"),
                        align: "left",
                    },
                ],

                updateStopList() {
                    stops.getIndex().then(() => {
                        props.route_stops.forEach((route_stop) => {
                            //if stop is null, do nothing
                            if (!route_stop.stop_id) return;
                            //if stop id not in stop list (stop was deleted) then remove
                            else if (!stops.list.map(({ id }) => id).includes(route_stop.stop_id)) {
                                route_stop.stop_id = null;
                            }
                        });
                    });
                },
            };
        },
    };
</script>
