<template>
    <div class="col-grow">
        <q-card-section>
            <div class="text-h4">
                {{ t("create_booking") }}
            </div>
        </q-card-section>
        <q-card-section :class="boatCategory ? '' : 'bg-info'">
            <div class="q-py-md" :class="$q.screen.gt.sm ? 'q-px-md' : ''">
                <div class="" style="max-width: 400px">
                    <!-- date -->
                    <MyDateSelect
                        :model-value="selectedDate"
                        @update:model-value="selectDate"
                        :label="t('select_date')"
                        @blur="touch('selectedDate')"
                        :validation="v$.selectedDate"
                        icon="fas fa-calendar-day"
                    />

                    <!-- first stop -->
                    <q-select
                        filled
                        :model-value="firstStopId"
                        @update:model-value="selectFirstStop"
                        :options="firstStops"
                        option-label="name"
                        option-value="id"
                        emit-value
                        map-options
                        :label="t('filter_first_stop')"
                        :loading="stops.isLoading"
                        clearable
                        bottom-slots
                    >
                        <template v-slot:before>
                            <q-icon name="fas fa-map-pin" />
                        </template>
                    </q-select>

                    <!-- boat category -->
                    <q-select
                        filled
                        v-model="boatCategory"
                        :options="availableBoats"
                        option-label="name"
                        :label="t('filter_boat_category')"
                        :loading="boatCategories.isLoading"
                        clearable
                        bottom-slots
                    >
                        <template v-slot:before>
                            <q-icon name="fas fa-ship" />
                        </template>
                        <template v-slot:option="scope">
                            <q-item v-bind="scope.itemProps">
                                <q-item-section avatar>
                                    <q-img width="150px" ratio="1" fit="contain" :src="scope.opt.imageURL" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                                    <q-item-label caption>
                                        {{ scope.opt.description }}
                                    </q-item-label>
                                </q-item-section>
                            </q-item>
                        </template>
                    </q-select>

                    <!-- guided -->
                    <my-btn-toggle
                        :model-value="guidedFilter"
                        @update:model-value="selectGuided"
                        :disable="!connectedClient.is_guided"
                        :label="t('with_guide')"
                        icon="fas fa-hiking"
                        :options="[
                            { label: t('no'), value: 0 },
                            { label: t('yes'), value: 1 },
                        ]"
                    />
                </div>
            </div>
            <q-img v-if="boatCategory" class="bg-boat-category" :src="boatCategory.imageURL" />
        </q-card-section>
        <q-card-section>
            <div class="row items-center" v-if="boatCategory">
                {{ boatCategory.activity.description }}
            </div>
        </q-card-section>
        <q-card-section v-if="isLoading == false">
            <q-card v-if="bookingCandidates.list.length == 0">
                <q-card-section>
                    {{ t("no_trip") }}
                </q-card-section>
            </q-card>
            <q-card v-for="(bookingCandidate, index) of bookingCandidatesList" :key="index" class="row q-mb-sm">
                <q-card-section class="col-sm-12 col-md-6">
                    <p class="text-h6 q-ma-none">
                        <q-icon name="fas fa-clock" style="color: rgba(0, 0, 0, 0.54)" />
                        {{ bookingCandidate.trip.start_time + " - " + bookingCandidate.trip.end_time }}
                    </p>
                    <p class="q-ma-none">
                        <q-icon name="fas fa-map-pin" style="color: rgba(0, 0, 0, 0.54)" />
                        {{ bookingCandidate.trip.route.firstRouteStop.stop.name }}
                    </p>
                    <p class="q-ma-none">
                        <q-icon name="fas fa-ship" style="color: rgba(0, 0, 0, 0.54)" />
                        {{ bookingCandidate.trip.boatCategory.name }}
                    </p>
                    <p class="q-ma-none">
                        <q-icon name="fas fa-hiking" style="color: rgba(0, 0, 0, 0.54)" />
                        {{ bookingCandidate.trip.is_guided != 2 ? bookingCandidate.trip.formatOption("guided") : "" }}
                    </p>
                </q-card-section>
                <q-card-section class="col-sm-12 col-md-6">
                    <q-btn
                        :disable="bookingCandidate.total_availability < 1"
                        color="primary"
                        @click="book(bookingCandidate)"
                        >{{
                            t("book") + " (" + t("available_places", bookingCandidate.total_availability) + ")"
                        }}</q-btn
                    >
                </q-card-section>
            </q-card>
        </q-card-section>
        <BookingCreate v-if="bookingCreateShow" @hide="bookingCreateShow = false" @booked="booked" />
    </div>
</template>

<script>
    import { onMounted, ref, computed, watch } from "vue";
    import { useI18n } from "vue-i18n";
    import { useBookingCandidates } from "../store/bookingCandidates";
    import { useTrips } from "../store/trips";
    import { useRoutes } from "../store/routes";
    import { useBoatCategories } from "../store/boatCategories";
    import { useStops } from "../store/stops";
    import { date } from "quasar";
    import BookingCreate from "../components/BookingCreate.vue";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";
    import { required, isDate, dateAfter } from "src/utilities/validators";
    import { useClients } from "src/store/clients";
    import MyDateSelect from "src/components/forms_elements/MyDateSelect.vue";
    import MyBtnToggle from "./forms_elements/MyBtnToggle.vue";
    export default {
        // name: 'ComponentName',
        emits: ["booked"],
        components: {
            BookingCreate,
            MyDateSelect,
            MyBtnToggle,
        },
        setup(props, { emit }) {
            const { t } = useI18n(),
                bookingCandidates = useBookingCandidates(),
                trips = useTrips(),
                routes = useRoutes(),
                boatCategories = useBoatCategories(),
                boatCategory = ref(),
                stops = useStops(),
                isLoading = ref(true),
                { formatDate, buildDate } = date,
                selectedDate = ref(formatDate(new Date(), "YYYY-MM-DD")),
                bookingCreateShow = ref(false),
                today = ref(buildDate({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })),
                bookingCandidatesList = computed(() => bookingCandidates.filteredList(filters.value)),
                firstStopId = ref(),
                guidedFilter = ref();
            let filters = ref({});
            const connectedClient = useClients().current;

            onMounted(() => {
                toggleShowFull(false);
                loadData();
                if (!connectedClient.is_guided) guidedFilter.value = 1;
            });

            async function loadData() {
                isLoading.value = true;
                await Promise.all([routes.getIndexDebounce(), stops.getIndexDebounce()]);
                await bookingCandidates.getIndex({ date: selectedDate.value });
                return (isLoading.value = false);
            }

            function toggleShowFull(selectedShowFull) {
                if (selectedShowFull === true) {
                    delete filters.value.notFull;
                } else {
                    filters.value.notFull = {
                        path: "total_availability",
                        operator: ">",
                        value: 0,
                    };
                }
            }

            const firstStops = computed(() => {
                if (bookingCandidates.list.length == 0) {
                    return [{ name: t("no_trip"), disable: true }];
                }
                return [
                    ...bookingCandidates.list.reduce((stops, bookingCandidate) => {
                        stops.add(bookingCandidate.trip.route.route_stops[0].stop);
                        return stops;
                    }, new Set()),
                ];
            });

            const availableBoats = computed(() => {
                if (bookingCandidates.list.length == 0) {
                    return [{ name: t("no_trip"), disable: true }];
                }
                return [
                    ...bookingCandidates.list.reduce((boatCategories, bookingCandidate) => {
                        boatCategories.add(bookingCandidate.trip.boatCategory);
                        return boatCategories;
                    }, new Set()),
                ];
            });

            const validations = useServerValidations();
            const rules = computed(() => ({
                selectedDate: { required, isDate, dateAfter: dateAfter(today.value) },
            }));

            const v$ = useVuelidate(
                rules,
                { selectedDate },
                {
                    $externalResults: computed(() => validations.errors),
                    $lazy: true,
                }
            );

            watch(boatCategory, (selectedBoatCategory) => {
                if (selectedBoatCategory === null) {
                    delete filters.value.boat_category_id;
                } else {
                    filters.value.boat_category_id = {
                        path: "trip.boat_category_id",
                        value: selectedBoatCategory.id,
                    };
                }
            });

            return {
                t,
                connectedClient,
                bookingCandidates,
                trips,
                isLoading,
                boatCategories,
                boatCategory,
                selectedDate,
                stops,
                toggleShowFull,
                bookingCreateShow,
                today,
                firstStops,
                availableBoats,
                v$,
                bookingCandidatesList,
                guidedFilter,
                firstStopId,

                filterStyle: computed(() =>
                    boatCategory.value ? 'background-image: url("' + boatCategory.value.imageURL + '");' : ""
                ),
                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },
                selectDate(value) {
                    selectedDate.value = value ? value : formatDate(new Date(), "YYYY-MM-DD");
                    v$.value.$touch();
                    if (v$.value.$error) return;
                    delete filters.value.firstStop;
                    bookingCandidates.getIndex({ date: selectedDate.value });
                },

                selectFirstStop(selectedStop) {
                    firstStopId.value = selectedStop;
                    if (selectedStop === null) {
                        delete filters.value.firstStop;
                    } else {
                        filters.value.firstStop = {
                            path: "trip.route.firstRouteStop.stop_id",
                            value: selectedStop,
                        };
                    }
                },
                selectGuided(selectedGuided) {
                    guidedFilter.value = selectedGuided;
                    if (selectedGuided === null) {
                        delete filters.value.guided;
                    } else {
                        filters.value.guided = {
                            path: "guided",
                            value: selectedGuided == 1 ? 3 : 1,
                            operator: "!=",
                        };
                    }
                },

                book(event) {
                    bookingCandidates.selected = [event];
                    bookingCreateShow.value = true;
                },
                booked(booking) {
                    bookingCreateShow.value = false;
                    emit("booked", booking);
                },
            };
        },
    };
</script>

<style lang="scss" scoped>
    .bg-boat-category {
        opacity: 0.2;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        position: absolute;
        z-index: -1;
    }
</style>
