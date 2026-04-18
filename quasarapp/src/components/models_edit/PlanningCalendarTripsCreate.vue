<template>
    <q-dialog :model-value="true" full-width>
        <q-card>
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ t("create_trip") }}</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>
            <q-form @submit="save" @reset="cancel">
                <q-card-section class="row q-pt-sm q-col-gutter-md">
                    <!-- select route -->
                    <div class="col-xs-12 col-sm-6">
                        <BasicModelSelect
                            v-model="trip.route_id"
                            :model-store="routes"
                            :validation="v$.route_id"
                            @blur="touch('route_id')"
                        />
                    </div>

                    <!-- Select boat category -->
                    <div class="col-xs-12 col-sm-6">
                        <BasicModelSelect
                            v-model="trip.boat_category_id"
                            :model-store="boatCategories"
                            :validation="v$.boat_category_id"
                        />
                    </div>

                    <!-- Boat inventory -->
                    <div class="col-xs-12 col-sm-6">
                        <q-toggle v-model="useInventory" :label="t('use_inventory')" />
                    </div>
                    <div class="col-xs-12 col-sm-6">
                        <!-- Boat inventory -->

                        <BoatInventorySelect
                            :disable="!trip.boat_category_id || !useInventory"
                            v-model:boat_inventory_id="trip.boat_inventory_id"
                            :boat_category_id="trip.boat_category_id"
                        />
                    </div>

                    <!-- start_time -->
                    <q-input
                        ref="startTimeSelect"
                        :label="t('start_time')"
                        class="col-xs-12 col-sm-6"
                        filled
                        v-model="trip.start_time"
                        mask="##:##"
                        placeholder="HH:MM"
                        @focus="$refs.startTimeSelect.select()"
                        @blur="touch('start_time')"
                        :error="v$.start_time.$error"
                    >
                        <template v-slot:before>
                            <q-icon class="gt-xs" name="fas fa-bell" />
                        </template>
                        <template v-slot:append>
                            <q-icon name="fas fa-clock" class="cursor-pointer">
                                <q-popup-proxy
                                    anchor="bottom right"
                                    self="top right"
                                    ref="startTimeProxy"
                                    transition-show="scale"
                                    transition-hide="scale"
                                >
                                    <div>
                                        <q-time
                                            v-model="trip.start_time"
                                            @update:model-value="$refs.startTimeProxy.hide()"
                                            mask="HH:mm"
                                            minimal
                                            format24h
                                            :options="(hr, min, sec) => min % 5 == 0"
                                        />
                                    </div>
                                </q-popup-proxy>
                            </q-icon>
                        </template>
                        <template v-slot:error>
                            <template v-for="error of v$.start_time.$errors" :key="error.$uid">
                                <div v-html="error.$message" class="text-negative"></div>
                            </template>
                        </template>
                    </q-input>

                    <!-- Guided -->
                    <div class="col-xs-12 col-sm-6">
                        <div class="row no-wrap items-center">
                            <div class="q-field__before q-field__marginal row items-center gt-xs">
                                <q-icon name="fas fa-hiking" />
                            </div>
                            <q-btn-toggle
                                v-model="trip.guided"
                                toggle-color="accent"
                                :size="$q.screen.lt.sm ? 'sm' : 'md'"
                                clearable
                                :options="[
                                    { label: t('guide_mandatory'), value: 1 },
                                    { label: t('guide_optional'), value: 2 },
                                    { label: t('guide_not_available'), value: 3 },
                                ]"
                                spread
                            />
                        </div>
                    </div>
                </q-card-section>
                <q-card-section class="q-pt-none">
                    <div class="text-subtitle1 q-pa-xs q-pt-md">
                        {{ t("repeat_trip") }}
                    </div>
                    <div class="row q-col-gutter-md">
                        <!-- interval -->
                        <q-input
                            ref="intervalInput"
                            v-model.number="interval"
                            filled
                            :label="t('interval')"
                            type="number"
                            :min="0"
                            class="col-xs-12 col-sm-6 q-mb-lg"
                            @focus="$refs.intervalInput.select()"
                            @blur="touch2('interval')"
                            :error="v2.interval.$error"
                        >
                            <template v-slot:before>
                                <q-icon class="gt-xs" name="fas fa-angle-double-right" />
                            </template>
                            <template v-slot:error>
                                <template v-for="error of v2.interval.$errors" :key="error.$uid">
                                    <div v-html="error.$message" class="text-negative"></div>
                                </template>
                            </template>
                        </q-input>

                        <!-- lastDeparture -->
                        <q-input
                            ref="lastDepartureSelect"
                            :label="t('last_departure')"
                            class="col-xs-12 col-sm-6"
                            filled
                            v-model="lastDeparture"
                            mask="##:##"
                            placeholder="HH:MM"
                            @focus="$refs.lastDepartureSelect.select()"
                            @blur="touch2('lastDeparture')"
                            :error="v2.lastDeparture.$error"
                        >
                            <template v-slot:before>
                                <q-icon class="gt-xs" name="fas fa-bell-slash" />
                            </template>
                            <template v-slot:append>
                                <q-icon name="fas fa-clock" class="cursor-pointer">
                                    <q-popup-proxy
                                        anchor="bottom right"
                                        self="top right"
                                        ref="lastDepartureProxy"
                                        transition-show="scale"
                                        transition-hide="scale"
                                    >
                                        <div>
                                            <q-time
                                                v-model="lastDeparture"
                                                @update:model-value="$refs.lastDepartureProxy.hide()"
                                                mask="HH:mm"
                                                minimal
                                                format24h
                                                :options="(hr, min, sec) => min % 5 == 0"
                                            />
                                        </div>
                                    </q-popup-proxy>
                                </q-icon>
                            </template>
                            <template v-slot:error>
                                <template v-for="error of v2.lastDeparture.$errors" :key="error.$uid">
                                    <div v-html="error.$message" class="text-negative"></div>
                                </template>
                            </template>
                        </q-input>
                    </div>
                </q-card-section>
                <q-card-section>
                    {{ t("number_of_trips_to_create", numberOfTrips) }}
                    <br />
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat :label="t('cancel')" color="dark" type="reset" v-close-popup />
                    <q-btn flat :label="t('create')" color="positive" type="submit" />
                </q-card-actions>
            </q-form>
        </q-card>
    </q-dialog>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { computed, ref } from "vue";
    import { useQuasar, date } from "quasar";
    import { Trip } from "src/store/trips";
    import { useRoutes } from "../../store/routes";
    import { useBoatCategories } from "../../store/boatCategories";
    import { dateToTimeString, timeToDate } from "../../utilities/helpers";
    import { useTrips } from "../../store/trips";
    import BoatInventorySelect from "../forms_elements/BoatInventorySelect.vue";
    import BasicModelSelect from "../forms_elements/BasicModelSelect.vue";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";
    import { required, isTime, minValue, noRule } from "src/utilities/validators";

    export default {
        name: "CalendarTripsCreate",
        props: {
            serviceId: Number,
        },
        emits: ["change"],
        components: {
            BoatInventorySelect,
            BasicModelSelect,
        },

        setup(props, { emit }) {
            const { t } = useI18n();
            const $q = useQuasar();
            const routes = useRoutes();
            const boatCategories = useBoatCategories();
            const trips = useTrips();
            const trip = ref(new Trip({ service_id: props.serviceId, guided: 2 }));
            const interval = ref(0);
            const lastDeparture = ref();
            const minutes = computed(() => {
                return Math.max(
                    date.getDateDiff(
                        date.extractDate("1970-01-01 " + lastDeparture.value, "YYYY-MM-DD HH:mm"),
                        timeToDate(trip.value.start_time),
                        "minutes"
                    ),
                    0
                );
            });
            const numberOfTrips = computed(() => {
                if (interval.value > 0) {
                    return 1 + Math.floor(minutes.value / interval.value);
                } else {
                    return 1;
                }
            });

            const validations = useServerValidations();
            const rules = {
                route_id: { required },
                start_time: { required, isTime },
                boat_category_id: { required },
            };

            const v$ = useVuelidate(rules, trip, {
                $externalResults: computed(() => validations.errors),
                $lazy: true,
            });
            const v2 = useVuelidate(
                { interval: { minValue: minValue(0) }, lastDeparture: { isTime } },
                { interval, lastDeparture },
                {
                    $externalResults: computed(() => validations.errors),
                    $lazy: true,
                }
            );

            return {
                t,
                trip,
                interval,
                lastDeparture,
                numberOfTrips,
                boatCategories,
                routes,
                useInventory: ref(false),
                v$,
                v2,

                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },
                touch2(field) {
                    v2.value[field].$touch();
                    delete validations.errors[field];
                },
                save() {
                    v$.value.$touch();
                    v2.value.$touch();
                    if (v$.value.$error || v2.value.$error) return;

                    const requests = [];

                    for (let i = 0; i < numberOfTrips.value; i++) {
                        requests.push(
                            trips.store(
                                new Trip({
                                    ...trip.value,
                                    start_time: dateToTimeString(
                                        date.addToDate(timeToDate(trip.value.start_time), {
                                            minutes: interval.value * i ?? 0,
                                        })
                                    ),
                                })
                            )
                        );
                    }

                    Promise.all(requests).then(() => {
                        $q.notify({
                            color: "positive",
                            icon: "cloud_done",
                            message: t("saved"),
                        });
                        emit("change");
                    });
                },

                cancel() {
                    trip.value = new Trip();
                },
            };
        },
    };
</script>
