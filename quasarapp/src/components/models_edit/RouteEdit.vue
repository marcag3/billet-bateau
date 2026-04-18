<template>
    <ModelEditTemplate
        full-width
        :model-store="routes"
        :model="route"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    >
        <q-card-section class="q-pa-none">
            <div class="text-subtitle1 q-pl-md">{{ t("route_stops") }}</div>
            <!-- stops list -->
            <RouteEditStopList v-model:route_stops="route.route_stops" />
        </q-card-section>
    </ModelEditTemplate>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref } from "vue";
    import RouteEditStopList from "components/models_edit/RouteEditStopList";
    import { Route, useRoutes } from "../../store/routes";
    import { required } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import { useAreas } from "src/store/areas";

    export default {
        name: "RouteEdit",
        props: {
            create: Boolean,
        },
        emits: ["updated", "deleted"],
        components: {
            RouteEditStopList,
            ModelEditTemplate,
        },

        setup(props) {
            const { t } = useI18n();
            const routes = useRoutes();
            const areas = useAreas();
            const route = ref();

            route.value = props.create
                ? new Route({
                      route_stops: [{ stop_sequence: 1, arrival_minutes: "0", stop: null }],
                  })
                : new Route(routes.current);

            const rules = {
                name: { required },
                area_id: { required },
            };

            return {
                t,
                routes,
                route,
                rules,
                fields: [
                    { name: "name", icon: "fas fa-clipboard", component: "MyInput" },
                    { name: "area_id", component: "BasicModelSelect", attributes: { modelStore: areas } },
                ],
            };
        },
    };
</script>
