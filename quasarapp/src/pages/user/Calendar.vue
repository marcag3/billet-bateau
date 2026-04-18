<template>
    <q-btn flat dense @click="loadData" icon="fa fa-sync-alt"></q-btn>
    <div class="row q-gutter-md justify-around q-mb-md">
        <div>
            <span style="display: inline-block; width: 15px; height: 15px" class="bg-grey-4 q-mr-xs"></span
            >{{ t("planned_trip") }}
        </div>
        <div>
            <span style="display: inline-block; width: 15px; height: 15px" class="bg-positive q-mr-xs"></span
            >{{ t("booked_trip") }}
        </div>
        <div>
            <span style="display: inline-block; width: 15px; height: 15px" class="bg-secondary q-mr-xs"></span
            >{{ t("on_water_sailing_plan") }}
        </div>
        <div>
            <span style="display: inline-block; width: 15px; height: 15px" class="bg-primary q-mr-xs"></span
            >{{ t("finished_sailing_plan") }}
        </div>
    </div>
    <NavigationBar :selectedDate="selectedDate" @update:selectedDate="changeDate" :weekdays="weekdays" />
    <QCalendarDay
        ref="calendar"
        v-model="selectedDate"
        view="day"
        :column-count="boatCategories.list.length"
        :interval-start="intervalStart"
        :interval-minutes="intervalMinutes"
        :interval-count="intervalCount"
        :interval-height="intervalHeight"
        :weekdays="weekdays"
        hoverable
        animated
        bordered
        hour24-format
        @click-time="onClickTime"
    >
        <template #head-day="{ scope }" v-if="!boatCategories.isLoading">
            <div style="text-align: center; font-weight: 800">
                {{ boatCategories.list[scope.columnIndex].name }}
            </div>
        </template>
        <template #day-body="{ scope: { columnIndex, timeStartPos, timeDurationHeight } }" v-if="!isLoading">
            <template v-for="(event, index) in getEvents(columnIndex)" :key="index">
                <div
                    v-if="event.time !== undefined"
                    class="my-event shadow-2 rounded-border"
                    :class="eventClasses(event)"
                    @click="eventClick(event)"
                    :style="eventStyles(event, timeStartPos, timeDurationHeight)"
                >
                    <span class="title q-pa-sm">{{ event.title }} </span>
                    <q-tooltip class="bg-amber text-black shadow-4">
                        <p>
                            {{ event.displayName }}
                        </p>
                        <p>
                            {{
                                t("start_from") +
                                ": " +
                                event.trip.route.route_stops[0].stop.name +
                                " " +
                                t("start_at") +
                                ": " +
                                event.time
                            }}
                        </p>
                    </q-tooltip>
                </div>
            </template>
        </template>
        <template #day-container="{ scope: { days } }">
            <template v-if="hasDate(days)">
                <div class="day-view-current-time-indicator" :style="style" />
                <div class="day-view-current-time-line" :style="style" />
            </template>
        </template>
    </QCalendarDay>
    <SailingPlanEdit
        v-if="sailingPlanEditShow"
        @hide="sailingPlanEditShow = false"
        @updated="sailingPlans.getIndex({ date: selectedDate }), (sailingPlanEditShow = false)"
    />

    <BookingCandidate
        v-if="bookingCandidateShow"
        @hide="bookingCandidateShow = false"
        @createSailingPlan="createSailingPlan()"
        @update="bookingCandidates.getIndex({ date: selectedDate })"
    />
</template>

<script>
    import { QCalendarDay, today } from "@quasar/quasar-ui-qcalendar";
    import "@quasar/quasar-ui-qcalendar/src/QCalendarVariables.sass";
    import "@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.sass";
    import "@quasar/quasar-ui-qcalendar/src/QCalendarDay.sass";
    import { ref, computed, onMounted } from "vue";

    import NavigationBar from "../../components/NavigationBar.vue";
    import { useI18n } from "vue-i18n";
    import { SailingPlan, useSailingPlans } from "src/store/sailingPlans";
    import { useBookingCandidates } from "src/store/bookingCandidates";
    import { useTrips } from "src/store/trips";
    import { useRoutes } from "src/store/routes";
    import { useBoatCategories } from "src/store/boatCategories";
    import SailingPlanEdit from "../../components/models_edit/SailingPlanEdit";
    import BookingCandidate from "../../components/BookingCandidate";
    import { createEvent, eventIsConcurent, assignEventColumn } from "../../utilities/helpers";
    import useTimeIndicator from "../../composables/useTimeIndicator";
    import { useStops } from "src/store/stops";
    import { useBookings } from "src/store/bookings";
    import { useUsers } from "src/store/users";

    export default {
        // name: 'PageName',
        components: {
            QCalendarDay,
            NavigationBar,
            SailingPlanEdit,
            BookingCandidate,
        },
        setup() {
            const { t } = useI18n(),
                bookingCandidates = useBookingCandidates(),
                sailingPlans = useSailingPlans(),
                boatCategories = useBoatCategories(),
                bookings = useBookings(),
                trips = useTrips(),
                routes = useRoutes(),
                stops = useStops(),
                users = useUsers(),
                events = ref([]),
                calendar = ref(),
                selectedDate = ref(today()),
                isLoading = ref(true),
                intervalStart = ref(36),
                intervalMinutes = ref(15),
                intervalCount = ref(48),
                intervalHeight = ref(28),
                sailingPlan = ref(new SailingPlan()),
                sailingPlanEditShow = ref(false),
                bookingCandidateShow = ref(false),
                { style, adjustCurrentTime, hasDate } = useTimeIndicator(calendar);

            const eventsMap = computed(() => {
                const map = {};
                sailingPlans.list.forEach((sailingPlan) => {
                    createEvent(map, sailingPlan);
                });
                bookingCandidates.list.forEach((bookingCandidate) => {
                    createEvent(map, bookingCandidate);
                });
                Object.keys(map).forEach((boat_category_id) => {
                    map[boat_category_id].forEach((event) => {
                        const concurentEvents = map[boat_category_id].filter((otherEvent) => {
                            return eventIsConcurent(otherEvent, event);
                        });
                        if (concurentEvents.length > 1) {
                            assignEventColumn(concurentEvents);
                        }
                    });
                });
                return map;
            });

            function getEvents(columnIndex) {
                if (eventsMap.value) {
                    return eventsMap.value[boatCategories.list[columnIndex].id];
                }
                return [];
            }
            function loadData() {
                isLoading.value = true;
                Promise.all([
                    sailingPlans.getIndex({ date: selectedDate.value }),
                    bookingCandidates.getIndex({ date: selectedDate.value }),
                    bookings.getIndex({ date: selectedDate.value }),
                    trips.getIndex(),
                    routes.getIndex(),
                    stops.getIndex(),
                    users.getIndex(),
                    boatCategories.getIndex(),
                ]).then(() => {
                    isLoading.value = false;
                    adjustCurrentTime();
                });
            }

            onMounted(() => {
                loadData();
            });

            return {
                t,
                calendar,
                eventsMap,
                selectedDate,
                events,
                getEvents,
                isLoading,
                style,
                boatCategories,
                weekdays: ref([1, 2, 3, 4, 5, 6, 0]),
                intervalStart,
                intervalMinutes,
                intervalCount,
                intervalHeight,
                sailingPlan,
                sailingPlans,
                sailingPlanEditShow,
                loadData,
                hasDate,
                bookingCandidates,
                bookingCandidateShow,

                eventClasses(event) {
                    return {
                        "text-white": event.status > 0,
                        "bg-grey-4": event.status == 0,
                        "bg-positive": event.status == 1,
                        "bg-secondary": event.status == 2,
                        "bg-primary": event.status == 3,
                    };
                },

                eventStyles(event, timeStartPos = undefined, timeDurationHeight = undefined) {
                    const s = {};
                    if (timeStartPos && timeDurationHeight) {
                        s.top = timeStartPos(event.time) + "px";
                        s.height = timeDurationHeight(event.duration - 1) + "px";
                    }
                    s["align-items"] = "flex-start";
                    s["left"] = (event.columnPosition - 1) * Math.floor(100 / event.concurentEvents) + "%";
                    s["width"] = "calc(" + Math.floor(100 / event.concurentEvents) + "% - 3px)";
                    return s;
                },
                changeDate(event) {
                    isLoading.value = true;
                    Promise.all([
                        sailingPlans.getIndex({ date: event }),
                        bookingCandidates.getIndex({ date: event }),
                    ]).then(() => {
                        selectedDate.value = event;
                        isLoading.value = false;
                    });
                },
                onClickTime({ scope }) {
                    // scope.timestamp.minute =
                    //     Math.floor(scope.timestamp.minute / intervalMinutes.value) * intervalMinutes.value;
                    // sailingPlans.selected = [
                    //     new SailingPlan({
                    //         departure: makeDateTime(scope.timestamp),
                    //         boat_category_id: boatCategories.list[scope.columnIndex].id,
                    //     }),
                    // ];
                    // sailingPlanEditShow.value = true;
                },
                eventClick(event) {
                    if (event.type === "BookingCandidate") {
                        bookingCandidates.selected = [event];
                        bookingCandidateShow.value = true;
                    }
                },
                createSailingPlan() {
                    const bookingCandidate = bookingCandidates.current;
                    sailingPlans.selected = [
                        new SailingPlan({
                            departure: selectedDate.value + " " + bookingCandidate.trip.start_time,
                            arrival: selectedDate.value + " " + bookingCandidate.trip.end_time,
                            trip_id: bookingCandidate.trip_id,
                            status: 2,
                        }),
                    ];
                    sailingPlanEditShow.value = true;
                },
            };
        },
    };
</script>
<style lang="sass">
    .my-event
      position: absolute
      font-size: 12px
      justify-content: center
      margin: 0 1px
      text-overflow: ellipsis
      overflow: hidden
      cursor: pointer
    .title
      position: relative
      display: flex
      justify-content: center
      align-items: center
      height: 100%
    .rounded-border
      border-radius: 10px
    abbr.tooltip
      text-decoration: none
    .day-view-current-time-indicator
      position: absolute
      left: -5px
      height: 10px
      width: 10px
      margin-top: -4px
      background-color: rgba(0, 0, 255, .5)
      border-radius: 50%

    .day-view-current-time-line
      position: absolute
      left: 5px
      border-top: rgba(0, 0, 255, .5) 2px solid
      width: calc(100% - 5px)

    .q-dark,
    .body--dark,
    .q-calendar--dark
      .day-view-current-time-indicator
        background-color: rgba(255, 255, 0, .85)

      .day-view-current-time-line
        border-top: rgba(255, 255, 0, .85) 2px solid
</style>
