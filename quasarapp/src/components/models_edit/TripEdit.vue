<template>
    <ModelEditTemplate
        :model-store="trips"
        :model="trip"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    />
</template>

<script>
    import { ref } from "vue";
    import { useTrips, Trip } from "../../store/trips";
    import { required, noRule, isTime } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import { useRoutes } from "src/store/routes";
    import { usePlanningCalendars } from "src/store/planningCalendars";
    import { useBoatCategories } from "src/store/boatCategories";
    import { useBoatInventories } from "src/store/boatInventories";
    import { useI18n } from "vue-i18n";

    export default {
        name: "TripEdit",
        props: { create: Boolean },
        emits: ["updated", "deleted"],
        components: {
            ModelEditTemplate,
        },

        setup(props) {
            const { t } = useI18n();
            const trips = useTrips();
            const trip = ref();
            const routes = useRoutes();
            const planningCalendars = usePlanningCalendars();
            const boatCategories = useBoatCategories();
            const boatInventories = useBoatInventories();

            trip.value = props.create ? new Trip() : new Trip(trips.current);

            const rules = {
                route_id: { required },
                service_id: { required },
                boat_category_id: { required },
                boat_inventory_id: { noRule },
                start_time: { isTime },
                guided: { required },
            };

            return {
                trips,
                trip,
                rules,
                fields: [
                    { name: "route_id", component: "BasicModelSelect", attributes: { modelStore: routes } },
                    {
                        name: "service_id",
                        component: "BasicModelSelect",
                        attributes: { modelStore: planningCalendars },
                    },
                    {
                        name: "boat_category_id",
                        component: "BasicModelSelect",
                        attributes: { modelStore: boatCategories },
                    },
                    {
                        name: "boat_inventory_id",
                        component: "BasicModelSelect",
                        attributes: { modelStore: boatInventories },
                    },
                    { name: "start_time", icon: "fas fa-bell", component: "MyTimeSelect" },
                    {
                        name: "guided",
                        icon: "fas fa-hiking",
                        component: "MyBtnToggle",
                        attributes: {
                            options: [
                                { label: t("guide_mandatory"), value: 1 },
                                { label: t("guide_optional"), value: 2 },
                                { label: t("guide_not_available"), value: 3 },
                            ],
                        },
                    },
                ],
            };
        },
    };
</script>
