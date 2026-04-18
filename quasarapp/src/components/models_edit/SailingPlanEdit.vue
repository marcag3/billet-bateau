<template>
    <ModelEditTemplate
        full-width
        :model-store="sailingPlans"
        :model="sailingPlan"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    >
        <boardings-edit :sailingPlan="sailingPlan" />
    </ModelEditTemplate>
</template>

<script>
    import { SailingPlan, useSailingPlans } from "src/store/sailingPlans";
    import { useI18n } from "vue-i18n";
    import { ref, computed, watch } from "vue";
    import { useTrips } from "src/store/trips";
    import { useUsers } from "src/store/users";
    import { date } from "quasar";
    import { required, minValue, isTime, noRule, isDateTime } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import { adjustTime, nextDeparture } from "src/utilities/helpers";
    import { useRoutes } from "src/store/routes";
    import { useBoatCategories } from "src/store/boatCategories";
    import BoardingsEdit from "./BoardingsEdit.vue";

    export default {
        // name: 'ComponentName',
        components: {
            ModelEditTemplate,
            BoardingsEdit,
        },
        props: { create: Boolean },
        emits: ["updated", "deleted"],
        setup(props) {
            const { t } = useI18n(),
                sailingPlans = useSailingPlans(),
                sailingPlan = ref(),
                trips = useTrips(),
                users = useUsers(),
                routes = useRoutes(),
                boatCategories = useBoatCategories(),
                { addToDate } = date;

            sailingPlan.value = props.create
                ? new SailingPlan({
                      departure: nextDeparture(),
                      number_of_passengers: 0,
                      number_of_teens: 0,
                      number_of_children: 0,
                  })
                : new SailingPlan(sailingPlans.current);

            const rules = {
                status: { required },
                trip_id: { noRule },
                route_id: { required },
                departure: { required, isDateTime },
                planned_duration: { required },
                arrival_time: { required, isTime },
                guide_id: { minValue: minValue(0) },
                number_of_passengers: { required, minValue: minValue(0) },
                number_of_teens: { required, minValue: minValue(0) },
                number_of_children: { required, minValue: minValue(0) },
                boat_charge: { minValue: minValue(0) },
                note: { noRule },
            };

            function updateRoute() {
                if (sailingPlan.value.trip_id && sailingPlan.value.status !== 3) {
                    sailingPlan.value.route_id = sailingPlan.value.trip.route_id;
                    updateDuration();
                }
            }
            function updateBoatCategory() {
                if (sailingPlan.value.trip_id && sailingPlan.value.status !== 3) {
                    sailingPlan.value.boat_category_id = sailingPlan.value.trip.boat_category_id;
                }
            }
            function updateDeparture() {
                if (sailingPlan.value.trip_id && sailingPlan.value.status !== 3) {
                    sailingPlan.value.departure = adjustTime(
                        sailingPlan.value.departure,
                        sailingPlan.value.trip.start_time
                    );
                    updateArrival();
                }
            }
            function updateDuration() {
                if (sailingPlan.value.route_id && sailingPlan.value.status !== 3) {
                    sailingPlan.value.planned_duration = sailingPlan.value.route.duration;
                    updateArrival();
                }
            }
            function updateArrival() {
                if (sailingPlan.value.status === 3 && !sailingPlan.value.arrival) {
                    sailingPlan.value.arrival = addToDate(sailingPlan.value.departure, {
                        minutes: sailingPlan.value.planned_duration,
                    });
                }
            }

            return {
                t,
                sailingPlans,
                sailingPlan,
                rules,
                fields: computed(() => [
                    {
                        name: "status",
                        icon: "fas fa-binoculars",
                        component: "MyBtnToggle",
                        attributes: {
                            options: SailingPlan.statusOptions,
                        },
                    },
                    {
                        name: "trip_id",
                        component: "BasicModelSelect",
                        attributes: {
                            modelStore: trips,
                        },
                        onChange: () => {
                            updateDeparture();
                            updateRoute();
                            updateBoatCategory();
                        },
                    },
                    {
                        name: "route_id",
                        component: "BasicModelSelect",
                        attributes: {
                            modelStore: routes,
                        },
                        OnChange: () => {
                            updateDuration();
                        },
                    },
                    {
                        name: "boat_category_id",
                        component: "BasicModelSelect",
                        attributes: {
                            modelStore: boatCategories,
                        },
                    },
                    {
                        name: "departure",
                        icon: "fas fa-bell",
                        component: "MyDateTimeSelect",
                        onChange: () => {
                            updateArrival();
                        },
                    },
                    {
                        name: "planned_duration",
                        icon: "fas fa-clock",
                        component: "MyInput",
                        onChange: () => {
                            updateArrival();
                        },
                    },
                    {
                        name: "arrival_time",
                        icon: "fas fa-home",
                        component: "MyTimeSelect",
                        attributes: {
                            disable: sailingPlan.value.status != 3,
                        },
                    },
                    {
                        name: "guide_id",
                        component: "BasicModelSelect",
                        label: t("guide_id"),
                        attributes: { modelStore: users },
                    },
                    {
                        name: "number_of_passengers",
                        icon: "fas fa-users",
                        component: "MyInput",
                        modifier: "number",
                        attributes: { min: 0, max: 30, type: "number" },
                    },
                    {
                        name: "number_of_teens",
                        icon: "fas fa-snowboarding",
                        component: "MyInput",
                        modifier: "number",
                        attributes: { min: 0, max: 30, type: "number" },
                        onChange: () => {
                            sailingPlan.value.number_of_passengers = Math.max(
                                sailingPlan.value.number_of_passengers,
                                Number(sailingPlan.value.number_of_teens) + Number(sailingPlan.value.number_of_children)
                            );
                        },
                    },
                    {
                        name: "number_of_children",
                        icon: "fas fa-child",
                        component: "MyInput",
                        modifier: "number",
                        attributes: { min: 0, max: 30, type: "number" },
                        onChange: () => {
                            sailingPlan.value.number_of_passengers = Math.max(
                                sailingPlan.value.number_of_passengers,
                                Number(sailingPlan.value.number_of_teens) + Number(sailingPlan.value.number_of_children)
                            );
                        },
                    },
                    {
                        name: "boat_charge",
                        icon: "fas fa-battery-three-quarters",
                        component: "MyInput",
                        modifier: "number",
                        attributes: { min: 0, max: 100, type: "number", suffix: "%" },
                    },
                    {
                        name: "note",
                        icon: "fas fa-pen",
                        component: "MyInput",
                        attributes: { autogrow: true },
                    },
                ]),
            };
        },
    };
</script>
