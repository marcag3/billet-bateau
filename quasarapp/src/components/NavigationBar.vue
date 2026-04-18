<template>
    <div class="title-bar" style="display: flex">
        <button tabindex="0" class="date-button direction-button direction-button__left" @click="onPrev">
            <span class="q-calendar__focus-helper" tabindex="-1" />
        </button>
        <div class="dates-holder">
            <transition :name="transition" appear>
                <div :key="parsedStart.date" class="internal-dates-holder">
                    <div v-for="day in days" :key="day.date" :style="dayStyle">
                        <button
                            tabindex="0"
                            style="width: 100%"
                            :class="dayClass(day)"
                            @click="
                                $emit('update:selectedDate', day.date);
                                transition = '';
                            "
                        >
                            <span class="q-calendar__focus-helper" tabindex="-1" />
                            <div style="width: 100%">
                                {{ monthFormatter(day, true) }}
                            </div>
                            <div style="width: 100%; font-size: 16px; font-weight: 700">
                                {{ dayFormatter(day, false) }}
                            </div>
                            <div style="width: 100%; font-size: 10px">
                                {{ weekdayFormatter(day, true) }}
                            </div>
                        </button>
                    </div>
                </div>
            </transition>
        </div>
        <button tabindex="0" class="date-button direction-button direction-button__right" @click="onNext">
            <span class="q-calendar__focus-helper" tabindex="-1" />
        </button>
    </div>
</template>

<script>
    import {
        addToDate,
        createDayList,
        createNativeLocaleFormatter,
        getEndOfWeek,
        getStartOfWeek,
        getWeekdaySkips,
        parseTimestamp,
        today,
    } from "@quasar/quasar-ui-qcalendar";
    import "@quasar/quasar-ui-qcalendar/src/QCalendarVariables.sass";
    import "@quasar/quasar-ui-qcalendar/src/QCalendarTransitions.sass";
    import "@quasar/quasar-ui-qcalendar/src/QCalendarDay.sass";

    import { ref, computed } from "vue";
    import { useI18n } from "vue-i18n";

    export default {
        // name: 'ComponentName',
        props: {
            selectedDate: String,
            weekdays: Array,
        },
        setup(props, { emit }) {
            const locale = useI18n({ useScope: "global" }).locale,
                monthFormatter = monthFormatterFunc(),
                dayFormatter = dayFormatterFunc(),
                weekdayFormatter = weekdayFormatterFunc(),
                transitionPrev = ref("slide-left"),
                transitionNext = ref("slide-right"),
                transition = ref("");

            const weekdaySkips = computed(() => {
                return getWeekdaySkips(props.weekdays);
            });

            const parsedStart = computed(() => {
                if (props.selectedDate) {
                    return getStartOfWeek(parseTimestamp(props.selectedDate), props.weekdays, today2.value);
                }
                return undefined;
            });
            const parsedEnd = computed(() => {
                if (props.selectedDate) {
                    return getEndOfWeek(parseTimestamp(props.selectedDate), props.weekdays, today2.value);
                }
                return undefined;
            });
            const days = computed(() => {
                if (parsedStart.value && parsedEnd.value) {
                    return createDayList(parsedStart.value, parsedEnd.value, today2.value, weekdaySkips.value);
                }
                return [];
            });
            const today2 = computed(() => {
                return parseTimestamp(today());
            });
            const dayStyle = computed(() => {
                const width = 100 / props.weekdays.length + "%";
                return {
                    width,
                };
            });

            function onPrev() {
                const ts = addToDate(parsedStart.value, { day: -7 });
                emit("update:selectedDate", ts.date);
                transition.value = "q-calendar--" + transitionPrev.value;
            }
            function onNext() {
                const ts = addToDate(parsedStart.value, { day: 7 });
                emit("update:selectedDate", ts.date);
                transition.value = "q-calendar--" + transitionNext.value;
            }
            function dayClass(day) {
                return {
                    "date-button": true,
                    "selected-date-button": props.selectedDate === day.date,
                };
            }

            function monthFormatterFunc() {
                const longOptions = { timeZone: "UTC", month: "long" };
                const shortOptions = { timeZone: "UTC", month: "short" };
                return createNativeLocaleFormatter(locale.value, (_tms, short) => (short ? shortOptions : longOptions));
            }
            function weekdayFormatterFunc() {
                const longOptions = { timeZone: "UTC", weekday: "long" };
                const shortOptions = { timeZone: "UTC", weekday: "short" };
                return createNativeLocaleFormatter(locale.value, (_tms, short) => (short ? shortOptions : longOptions));
            }
            function dayFormatterFunc() {
                const longOptions = { timeZone: "UTC", day: "2-digit" };
                const shortOptions = { timeZone: "UTC", day: "numeric" };
                return createNativeLocaleFormatter(locale.value, (_tms, short) => (short ? shortOptions : longOptions));
            }

            return {
                parsedStart,
                parsedEnd,
                days,
                dayStyle,
                onPrev,
                onNext,
                dayClass,
                transitionPrev,
                transitionNext,
                transition,
                monthFormatter,
                dayFormatter,
                weekdayFormatter,
            };
        },
    };
</script>
<style lang="scss" scoped>
    .title-bar {
        position: relative;
        width: 100%;
        height: 70px;
        background: $primary;
        overflow: hidden;
        border-radius: 3px;
        user-select: none;
    }
    .dates-holder {
        position: relative;
        width: 100%;
        align-items: center;
        display: flex;
        justify-content: space-between;
        color: #fff;
        overflow: hidden;
        user-select: none;
    }
    .internal-dates-holder {
        position: relative;
        width: 100%;
        display: inline-flex;
        flex: 1 1 100%;
        flex-direction: row;
        justify-content: space-between;
        overflow: hidden;
        user-select: none;
    }
    .direction-button {
        background: $primary;
        color: white;
        width: 40px;
        max-width: 50px !important;
    }
    .direction-button__left {
        &:before {
            content: "<";
            display: inline-flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;
            font-weight: 900;
            font-size: 3em;
        }
    }
    .direction-button__right {
        &:before {
            content: ">";
            display: inline-flex;
            flex-direction: column;
            justify-content: center;
            height: 100%;
            font-weight: 900;
            font-size: 3em;
        }
    }
    .date-button {
        color: white;
        background: $primary;
        z-index: 2;
        height: 100%;
        outline: 0;
        cursor: pointer;
        border-radius: 3px;
        display: inline-flex;
        flex: 1 0 auto;
        flex-direction: column;
        align-items: stretch;
        position: relative;
        border: 0;
        vertical-align: middle;
        padding: 0;
        font-size: 14px;
        line-height: 1.715em;
        text-decoration: none;
        font-weight: 500;
        text-transform: uppercase;
        text-align: center;
        user-select: none;
    }
    .selected-date-button {
        color: #3f51b5 !important;
        background: white !important;
    }
</style>
