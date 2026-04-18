<template>
    <q-dialog :model-value="true">
        <q-card>
            <q-form @submit="save">
                <q-card-section class="row items-center q-pb-none">
                    <div class="text-h4">{{ t("create_booking") }}</div>
                    <q-space />
                    <q-btn icon="close" flat round dense v-close-popup />
                </q-card-section>
                <q-card-section>
                    <p class="text-h6 q-ma-none">
                        <q-icon name="fas fa-clock" style="color: rgba(0, 0, 0, 0.54)" />
                        {{
                            bookingCandidates.selected[0].trip.start_time +
                            " - " +
                            bookingCandidates.selected[0].trip.end_time +
                            " (" +
                            bookingCandidates.selected[0].trip.route.formatDuration("duration", "minutes") +
                            ")"
                        }}
                    </p>
                    <p class="q-ma-none">
                        <q-icon name="fas fa-calendar-day" style="color: rgba(0, 0, 0, 0.54)" />
                        {{ formatDate(bookingCandidates.selected[0].for_date, "D MMMM YYYY") }}
                    </p>
                    <p class="q-ma-none">
                        <q-icon name="fas fa-map-pin" style="color: rgba(0, 0, 0, 0.54)" />
                        {{ bookingCandidates.selected[0].trip.route.firstRouteStop.stop.name }}
                    </p>
                    <p class="q-ma-none">
                        <q-icon name="fas fa-ship" style="color: rgba(0, 0, 0, 0.54)" />
                        {{ bookingCandidates.selected[0].trip.boatCategory.name }}
                    </p>
                    <p class="q-ma-none">
                        <q-icon name="fas fa-hiking" style="color: rgba(0, 0, 0, 0.54)" />
                        {{
                            bookingCandidates.selected[0].trip.is_guided != 2
                                ? bookingCandidates.selected[0].trip.formatOption("guided")
                                : ""
                        }}
                    </p>
                </q-card-section>
                <q-card-section>
                    <!-- <div class="row q-mt-lg justify-end">
                        {{ t("available_places", availability) }}
                    </div> -->

                    <!-- number of boats -->
                    <div v-if="bookingCandidates.selected[0].full_boat !== 2" class="row q-mt-lg">
                        <div class="col-xs-12 col-md-7 text-subtitle1">
                            <div class="row no-wrap items-center">
                                <div class="q-field__before q-field__marginal row items-center">
                                    <q-icon name="fas fa-cubes" />
                                </div>
                                {{ t("number_of_boats") }}
                            </div>
                        </div>
                        <div class="col-xs-12 col-md-5 text-center">
                            <q-btn round size="sm" icon="fas fa-minus" @click="decreaseBoats" />
                            <span class="text-h6 q-pl-md">{{ booking.number_of_boats }}</span>
                            <span class="text-subtitle2 text-grey-7 q-pr-md">
                                /{{ bookingCandidates.selected[0].boat_availability }}
                            </span>
                            <q-btn round size="sm" icon="fas fa-plus" @click="increaseBoats" />
                        </div>

                        <template v-if="v$.number_of_boats.$error">
                            <template v-for="error of v$.number_of_boats.$errors" :key="error.$uid">
                                <div v-html="error.$message" class="text-negative col-12"></div>
                            </template>
                        </template>
                    </div>

                    <!-- adults -->
                    <div class="row q-mt-lg">
                        <div class="col-xs-12 col-md-7 text-subtitle1">
                            <div class="row no-wrap items-center">
                                <div class="q-field__before q-field__marginal row items-center">
                                    <q-icon name="fas fa-user-tie" />
                                </div>
                                {{ t("number_of_adults") }}
                            </div>
                        </div>
                        <div class="col-xs-12 col-md-5 text-center">
                            <q-btn round size="sm" icon="fas fa-minus" @click="decreaseAdults" />
                            <span class="text-h6 q-pl-md">{{ booking.number_of_adults }}</span>
                            <span class="text-subtitle2 text-grey-7 q-pr-md"> /{{ maxAdults }} </span>
                            <q-btn round size="sm" icon="fas fa-plus" @click="increaseAdults" />
                        </div>

                        <template v-if="v$.number_of_adults.$error">
                            <template v-for="error of v$.number_of_adults.$errors" :key="error.$uid">
                                <div v-html="error.$message" class="text-negative col-12"></div>
                            </template>
                        </template>
                    </div>

                    <!-- teens -->
                    <div v-if="bookingCandidates.selected[0].teen_availability > 0" class="row q-mt-lg items-center">
                        <div class="col-xs-12 col-md-7 text-subtitle1">
                            <div class="row no-wrap items-center">
                                <div class="q-field__before q-field__marginal row items-center">
                                    <q-icon name="fas fa-snowboarding" />
                                </div>
                                {{ t("number_of_teens") }}
                            </div>
                        </div>
                        <div class="col-xs-12 col-md-5 text-center">
                            <q-btn round size="sm" icon="fas fa-minus" @click="decreaseTeens" />
                            <span class="text-h6 q-pl-md">{{ booking.number_of_teens }}</span>
                            <span class="text-subtitle2 text-grey-7 q-pr-md"> /{{ maxTeens }} </span>
                            <q-btn round size="sm" icon="fas fa-plus" @click="increaseTeens" />
                        </div>
                        <template v-if="v$.number_of_teens.$error">
                            <template v-for="error of v$.number_of_teens.$errors" :key="error.$uid">
                                <div v-html="error.$message" class="text-negative col-12"></div>
                            </template>
                        </template>
                    </div>

                    <!-- children -->
                    <div v-if="bookingCandidates.selected[0].child_availability > 0" class="row q-mt-lg items-center">
                        <div class="col-xs-12 col-md-7 text-subtitle1">
                            <div class="row no-wrap items-center">
                                <div class="q-field__before q-field__marginal row items-center">
                                    <q-icon name="fas fa-child" />
                                </div>
                                {{ t("number_of_children") }}
                            </div>
                        </div>
                        <div class="col-xs-12 col-md-5 text-center">
                            <q-btn round size="sm" icon="fas fa-minus" @click="decreaseChildren" />
                            <span class="text-h6 q-pl-md">{{ booking.number_of_children }}</span>
                            <span class="text-subtitle2 text-grey-7 q-pr-md"> /{{ maxChildren }} </span>
                            <q-btn round size="sm" icon="fas fa-plus" @click="increaseChildren" />
                        </div>
                        <template v-if="v$.number_of_children.$error">
                            <template v-for="error of v$.number_of_children.$errors" :key="error.$uid">
                                <div v-html="error.$message" class="text-negative col-12"></div>
                            </template>
                        </template>
                    </div>

                    <!-- number of passengers error -->
                    <template v-if="v$.number_of_passengers.$error">
                        <template v-for="error of v$.number_of_passengers.$errors" :key="error.$uid">
                            <div v-html="error.$message" class="text-negative col-12"></div>
                        </template>
                    </template>

                    <!-- guided -->
                    <div class="row q-mt-lg items-center" v-if="bookingCandidates.selected[0].trip.guided == 2">
                        <div class="col-xs-12 col-md-8 text-subtitle1">
                            <div class="row no-wrap items-center">
                                <div class="q-field__before q-field__marginal row items-center">
                                    <q-icon name="fas fa-hiking" />
                                </div>
                                {{ t("is_guided") + "?" }}
                            </div>
                        </div>

                        <q-btn-toggle
                            :disable="bookingCandidates.selected[0].trip.guided != 2"
                            spread
                            class="col-xs-12 col-md-4"
                            v-model="booking.is_guided"
                            toggle-color="accent"
                            :options="[
                                { label: t('no'), value: false },
                                { label: t('yes'), value: true },
                            ]"
                        />
                    </div>

                    <!-- note -->
                    <q-input
                        class="q-mt-lg"
                        filled
                        v-model="booking.note"
                        :label="t('a_note')"
                        autogrow
                        bottom-slots
                        :error="v$.note.$error"
                    >
                        <template v-slot:before>
                            <q-icon name="fas fa-pen" />
                        </template>
                        <template v-slot:error>
                            <template v-for="error of v$.note.$errors" :key="error.$uid">
                                <div v-html="error.$message" class="text-negative"></div>
                            </template>
                        </template>
                    </q-input>
                    <template v-for="error of v$.is_guided.$errors" :key="error.$uid">
                        <div v-html="error.$message" class="text-negative"></div>
                    </template>
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn flat :label="t('cancel')" color="dark" v-close-popup />
                    <q-btn :label="t('book')" color="primary" type="submit" />
                </q-card-actions>
            </q-form>
        </q-card>
    </q-dialog>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { useBookingCandidates } from "../store/bookingCandidates";
    import { Booking, useBookings } from "../store/bookings";
    import { date, useQuasar } from "quasar";
    import { useServerValidations } from "src/store/serverValidations";
    import useVuelidate from "@vuelidate/core";
    import {
        maxPeopleVal,
        maxTeensVal,
        maxChildrenVal,
        minValue,
        maxBoatsVal,
        minPerBoat,
        isTrueWhen,
        noRule,
    } from "src/utilities/validators";
    import { useClients } from "src/store/clients";

    export default {
        // name: 'ComponentName',
        emits: ["booked"],
        setup(props, { emit }) {
            const { t } = useI18n();
            const bookingCandidates = useBookingCandidates();
            const { formatDate } = date;
            const bookings = useBookings();
            const $q = useQuasar();

            const booking = ref(
                new Booking({
                    for_date: formatDate(bookingCandidates.selected[0].for_date, "YYYY-MM-DD"),
                    trip_id: bookingCandidates.selected[0].trip.id,
                    number_of_boats: 1,
                    number_of_adults: 0,
                    number_of_teens: 0,
                    number_of_children: 0,
                    is_guided: bookingCandidates.selected[0].trip.guided == 1,
                    is_full_boat: bookingCandidates.selected[0].full_boat !== 2,
                })
            );

            const totalAvailability = computed(() =>
                booking.value.is_full_boat
                    ? booking.value.number_of_boats * booking.value.trip.boatCategory.total_capacity
                    : bookingCandidates.selected[0].total_availability
            );
            const availability = computed(
                () =>
                    totalAvailability.value -
                    booking.value.number_of_adults -
                    booking.value.number_of_teens -
                    booking.value.number_of_children
            );
            const maxAdults = computed(
                () => totalAvailability.value - booking.value.number_of_teens - booking.value.number_of_children
            );

            const maxTeens = computed(() =>
                Math.min(
                    booking.value.is_full_boat
                        ? booking.value.number_of_boats * booking.value.trip.boatCategory.teen_capacity
                        : bookingCandidates.selected[0].teen_availability,
                    totalAvailability.value - booking.value.number_of_adults - booking.value.number_of_children
                )
            );

            const maxChildren = computed(() =>
                Math.min(
                    booking.value.is_full_boat
                        ? booking.value.number_of_boats * booking.value.trip.boatCategory.child_capacity
                        : bookingCandidates.selected[0].child_availability,
                    totalAvailability.value - booking.value.number_of_adults - booking.value.number_of_teens
                )
            );
            const validations = useServerValidations();
            const rules = computed(() => ({
                number_of_adults: { noRule },
                number_of_teens: { maxTeens: maxTeensVal(maxTeens.value) },
                number_of_children: { maxChildren: maxChildrenVal(maxChildren.value) },
                number_of_boats: { maxBoats: maxBoatsVal(bookingCandidates.selected[0].boat_availability) },
                note: { noRule },
                number_of_passengers: {
                    minValue: minValue(1),
                    minPerBoat: minPerBoat(
                        booking.value.number_of_boats,
                        booking.value.trip.boatCategory.minimum_booking_person
                    ),
                    maxPeople: maxPeopleVal(bookingCandidates.selected[0].total_availability),
                },
                is_guided: { isTrueWhen: isTrueWhen(useClients().current.is_guided == false) },
            }));
            const v$ = useVuelidate(rules, booking, { $externalResults: computed(() => validations.errors) });

            return {
                t,
                bookingCandidates,
                booking,
                formatDate,
                availability,
                maxAdults,
                maxTeens,
                maxChildren,
                v$,
                rules,
                decreaseBoats() {
                    booking.value.number_of_boats > 1 ? booking.value.number_of_boats-- : null;
                },
                increaseBoats() {
                    booking.value.number_of_boats < bookingCandidates.selected[0].boat_availability
                        ? booking.value.number_of_boats++
                        : null;
                },
                decreaseAdults() {
                    booking.value.number_of_adults > 0 ? booking.value.number_of_adults-- : null;
                },
                increaseAdults() {
                    booking.value.number_of_adults < maxAdults.value ? booking.value.number_of_adults++ : null;
                },
                decreaseTeens() {
                    booking.value.number_of_teens > 0 ? booking.value.number_of_teens-- : null;
                },
                increaseTeens() {
                    booking.value.number_of_teens < maxTeens.value ? booking.value.number_of_teens++ : null;
                },
                decreaseChildren() {
                    booking.value.number_of_children > 0 ? booking.value.number_of_children-- : null;
                },
                increaseChildren() {
                    booking.value.number_of_children < maxChildren.value ? booking.value.number_of_children++ : null;
                },
                save() {
                    validations.errors = {};
                    v$.value.$touch();
                    if (v$.value.$error) return;
                    bookings.store(booking.value).then(() => {
                        $q.notify({
                            color: "positive",
                            icon: "cloud_done",
                            message: t("booked"),
                        });
                        emit("booked", booking.value);
                    });
                },
            };
        },
    };
</script>
