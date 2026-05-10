<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader
                :title="t('tripsCalendar.title')"
                :description="t('tripsCalendar.description')"
            >
                <template #actions>
                    <q-btn
                        color="primary"
                        icon="add"
                        :label="t('tripsList.addTrip')"
                        :to="{ name: 'trips.create', params: { programId } }"
                    />
                </template>
            </AppPageHeader>
        </template>

        <AppEmptyListRow
            class="q-mb-md"
            :show="scheduledTripCount === 0"
            :message="t('tripsCalendar.empty')"
        />

        <div class="trips-calendar">
            <div class="trips-calendar-toolbar row items-center no-wrap q-mb-sm q-gutter-xs">
                <q-btn
                    flat
                    round
                    dense
                    icon="chevron_left"
                    :aria-label="t('tripsCalendar.prev')"
                    @click="calendarPrev"
                />
                <q-btn
                    flat
                    dense
                    no-caps
                    :label="t('tripsCalendar.goToday')"
                    @click="calendarToday"
                />
                <q-btn
                    flat
                    round
                    dense
                    icon="chevron_right"
                    :aria-label="t('tripsCalendar.next')"
                    @click="calendarNext"
                />
                <div class="col text-center text-subtitle1 text-weight-medium ellipsis">
                    {{ calendarTitle }}
                </div>
                <q-btn-toggle
                    v-model="calendarMode"
                    no-caps
                    unelevated
                    toggle-color="primary"
                    color="grey-3"
                    text-color="grey-8"
                    :options="viewToggleOptions"
                />
            </div>

            <QCalendarDay
                v-if="calendarMode !== 'month'"
                ref="dayCalendarRef"
                v-model="selectedDateStr"
                :view="calendarMode === 'day' ? 'day' : 'week'"
                bordered
                :locale="dateLocale"
                :weekdays="calendarWeekdays"
                hour24-format
                interval-minutes="30"
                interval-count="48"
                interval-height="22"
                date-header="stacked"
                :use-navigation="false"
                class="trips-calendar-surface"
            >
                <template #day-body="{ scope }">
                    <div class="trips-cal-day-body">
                        <div
                            v-for="ev in eventsForDay(scope.timestamp.date)"
                            :key="ev.id"
                            class="trips-cal-event-wrap"
                            :style="eventPositionStyle(scope, ev)"
                        >
                            <q-btn
                                dense
                                no-caps
                                padding="xs sm"
                                outline
                                color="primary"
                                class="trips-cal-event-btn full-width text-left"
                                @click="onTripClick(ev.id)"
                            >
                                <span class="ellipsis block">{{ ev.title }}</span>
                            </q-btn>
                        </div>
                    </div>
                </template>
            </QCalendarDay>

            <QCalendarMonth
                v-else
                ref="monthCalendarRef"
                v-model="selectedDateStr"
                bordered
                :locale="dateLocale"
                :weekdays="calendarWeekdays"
                :use-navigation="false"
                class="trips-calendar-surface"
            >
                <template #day="{ scope }">
                    <div
                        v-if="!scope.outside"
                        class="trips-cal-month-day column q-gutter-xs q-pa-xs"
                    >
                        <q-btn
                            v-for="ev in eventsForDay(scope.timestamp.date)"
                            :key="ev.id"
                            dense
                            no-caps
                            size="sm"
                            outline
                            color="primary"
                            class="trips-cal-month-event full-width text-left"
                            @click="onTripClick(ev.id)"
                        >
                            <span class="ellipsis block">{{ ev.title }}</span>
                        </q-btn>
                    </div>
                </template>
            </QCalendarMonth>
        </div>
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { QCalendarDay, QCalendarMonth, today } from "@quasar/quasar-ui-qcalendar";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import { joinTripsWithRelations } from "../powersync/joined-queries";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";

const powersync = getAppPowerSyncContext();

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const tripsCollection = powersync.collections.trips;
const boatTypesCollection = powersync.collections.boat_types;
const waterRoutesCollection = powersync.collections.water_routes;

const { data: tripsRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = tripsCollection.value;
        const btCol = boatTypesCollection.value;
        const wrCol = waterRoutesCollection.value;

        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || !btCol || !wrCol || pid.length === 0) return undefined;
        return joinTripsWithRelations(queryBuilder, col, btCol, wrCol)
            .where(({ t: trip }: Record<string, Record<string, unknown>>) =>
                eq(trip.program_id, pid),
            )
            .orderBy(
                ({ t: trip }: Record<string, Record<string, unknown>>) =>
                    trip.scheduled_departure_at,
                "desc",
            )
            .orderBy(
                ({ t: trip }: Record<string, Record<string, unknown>>) =>
                    trip.id,
                "desc",
            );
    },
    [
        tripsCollection,
        boatTypesCollection,
        waterRoutesCollection,
        powersync.activeProgramIdRef,
    ],
);

/** Row shape from `joinTripsWithRelations` live query (virtual columns included). */
interface TripCalendarRow {
    id: unknown;
    scheduled_departure_at?: unknown;
    capacity?: unknown;
    boatTypeName?: unknown;
    waterRouteName?: unknown;
}

interface TripCalendarEvent {
    id: string;
    title: string;
    /** Local calendar date `YYYY-MM-DD`. */
    date: string;
    /** `HH:mm` (24h) for QCalendar interval positioning. */
    time: string;
    start: Date;
}

/** QCalendar `#day-body` slot scope helpers (see `getScopeForSlot` in QCalendar). */
interface DayBodyScope {
    timestamp: { date: string };
    timeStartPos: (time: string, clamp?: boolean) => number | false;
    timeDurationHeight: (minutes: number) => number;
}

const trips = computed(() => (tripsRaw.value ?? []) as TripCalendarRow[]);

const programId = computed(() => String(route.params.programId ?? "").trim());

const dateLocale = computed(() =>
    locale.value === "fr" ? "fr-CA" : "en-CA",
);

const calendarWeekdays = computed(() =>
    locale.value === "fr" ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6],
);

type CalendarMode = "day" | "week" | "month";

const calendarMode = ref<CalendarMode>("week");
const selectedDateStr = ref(today());

interface QCalendarNavExpose {
    prev: (amount?: number) => void;
    next: (amount?: number) => void;
    moveToToday: () => void;
}

const dayCalendarRef = ref<QCalendarNavExpose | null>(null);
const monthCalendarRef = ref<QCalendarNavExpose | null>(null);

const viewToggleOptions = computed(() => [
    { label: t("tripsCalendar.viewDay"), value: "day" as const },
    { label: t("tripsCalendar.viewWeek"), value: "week" as const },
    { label: t("tripsCalendar.viewMonth"), value: "month" as const },
]);

const mondayFirstWeek = computed(() => locale.value === "fr");

function parseYmd(ymd: string): Date {
    const [y, m, d] = ymd.split("-").map((x) => Number(x));
    return new Date(y, m - 1, d);
}

function startOfWeekDate(d: Date, mondayFirst: boolean): Date {
    const x = new Date(d);
    const day = x.getDay();
    const offset = mondayFirst ? (day === 0 ? -6 : 1 - day) : -day;
    x.setDate(x.getDate() + offset);
    x.setHours(0, 0, 0, 0);
    return x;
}

function endOfWeekDate(start: Date): Date {
    const e = new Date(start);
    e.setDate(start.getDate() + 6);
    return e;
}

const calendarTitle = computed(() => {
    const d = parseYmd(selectedDateStr.value);
    const fmt = new Intl.DateTimeFormat(dateLocale.value, { dateStyle: "medium" });
    if (calendarMode.value === "day") {
        return new Intl.DateTimeFormat(dateLocale.value, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        }).format(d);
    }
    if (calendarMode.value === "week") {
        const s = startOfWeekDate(d, mondayFirstWeek.value);
        const e = endOfWeekDate(s);
        return `${fmt.format(s)} – ${fmt.format(e)}`;
    }
    return new Intl.DateTimeFormat(dateLocale.value, {
        month: "long",
        year: "numeric",
    }).format(d);
});

function calendarPrev(): void {
    if (calendarMode.value === "month") {
        monthCalendarRef.value?.prev();
    } else {
        dayCalendarRef.value?.prev();
    }
}

function calendarNext(): void {
    if (calendarMode.value === "month") {
        monthCalendarRef.value?.next();
    } else {
        dayCalendarRef.value?.next();
    }
}

function calendarToday(): void {
    if (calendarMode.value === "month") {
        monthCalendarRef.value?.moveToToday();
    } else {
        dayCalendarRef.value?.moveToToday();
    }
}

function parseDepartureDate(raw: unknown): Date | null {
    if (raw == null || String(raw).trim() === "") {
        return null;
    }
    const d = new Date(String(raw));
    if (Number.isNaN(d.getTime())) {
        return null;
    }
    return d;
}

function toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function toHHmm(d: Date): string {
    const h = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${mm}`;
}

const tripEvents = computed<TripCalendarEvent[]>(() => {
    const out: TripCalendarEvent[] = [];
    for (const tr of trips.value) {
        const start = parseDepartureDate(tr.scheduled_departure_at);
        if (start == null) {
            continue;
        }
        out.push({
            id: String(tr.id),
            title: buildEventTitle(tr, start),
            date: toYmd(start),
            time: toHHmm(start),
            start,
        });
    }
    return out;
});

const eventsByDate = computed(() => {
    const map = new Map<string, TripCalendarEvent[]>();
    for (const ev of tripEvents.value) {
        const list = map.get(ev.date) ?? [];
        list.push(ev);
        map.set(ev.date, list);
    }
    for (const list of map.values()) {
        list.sort((a, b) => a.start.getTime() - b.start.getTime());
    }
    return map;
});

function eventsForDay(date: string): TripCalendarEvent[] {
    return eventsByDate.value.get(date) ?? [];
}

const scheduledTripCount = computed(() => tripEvents.value.length);

function buildEventTitle(tr: TripCalendarRow, departure: Date): string {
    const timeFmt = new Intl.DateTimeFormat(dateLocale.value, {
        timeStyle: "short",
    }).format(departure);

    const parts: string[] = [timeFmt];

    const rawCap = tr.capacity;
    const capNum =
        rawCap == null || rawCap === ""
            ? null
            : Number(rawCap);
    if (capNum != null && !Number.isNaN(capNum)) {
        parts.push(t("tripsCalendar.eventCapacity", { cap: capNum }));
    }

    if (tr.boatTypeName != null && String(tr.boatTypeName).trim() !== "") {
        parts.push(String(tr.boatTypeName));
    }

    if (tr.waterRouteName != null && String(tr.waterRouteName).trim() !== "") {
        parts.push(String(tr.waterRouteName));
    }

    return parts.join(" · ");
}

function eventPositionStyle(
    scope: DayBodyScope,
    ev: TripCalendarEvent,
): Record<string, string> {
    const top = scope.timeStartPos(ev.time, true);
    const topPx = top === false ? 0 : top;
    const slotH = scope.timeDurationHeight(30);
    const minH = Math.max(slotH, 24);
    return {
        position: "absolute",
        left: "2px",
        right: "2px",
        top: `${topPx}px`,
        minHeight: `${minH}px`,
        zIndex: "1",
    };
}

function onTripClick(tripId: string): void {
    if (tripId.length === 0) {
        return;
    }
    void router.push({
        name: "trips.edit",
        params: {
            programId: programId.value,
            tripId,
        },
    });
}
</script>

<style scoped>
.trips-calendar {
    min-height: 32rem;
}

.trips-calendar-toolbar {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    padding-bottom: 0.5rem;
}

.trips-calendar-surface {
    border-radius: 4px;
    overflow: hidden;
}

.trips-cal-day-body {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.trips-cal-event-wrap {
    pointer-events: auto;
}

.trips-cal-event-btn {
    font-size: 0.75rem;
}

.trips-cal-month-day {
    min-height: 3rem;
    max-height: 6.5rem;
    overflow: auto;
}

.trips-cal-month-event {
    font-size: 0.7rem;
}
</style>
