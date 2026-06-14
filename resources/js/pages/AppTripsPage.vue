<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader :title="t('tripsCalendar.title')">
                <template #actions>
                    <q-btn color="primary" icon="add" :label="t('tripsList.addTrip')"
                        @click="tripModalRef?.openCreateModal()" />
                </template>
            </AppPageHeader>
        </template>

        <div class="trips-calendar-toolbar row items-center no-wrap q-mb-sm q-gutter-xs">
            <template v-if="tripsViewMode !== 'list'">
                <q-btn flat round dense icon="chevron_left" :aria-label="t('tripsCalendar.prev')"
                    :disable="!canCalendarPrev" @click="calendarPrev" />
                <q-btn flat dense no-caps :label="t('tripsCalendar.goToday')" @click="calendarToday" />
                <q-btn flat round dense icon="chevron_right" :aria-label="t('tripsCalendar.next')"
                    :disable="!canCalendarNext" @click="calendarNext" />
                <div class="col text-center text-subtitle1 text-weight-medium ellipsis">
                    {{ calendarTitle }}
                </div>
            </template>
            <div v-else class="col" />
            <q-btn-toggle v-model="tripsViewMode" no-caps unelevated toggle-color="primary" color="grey-3"
                text-color="grey-8" :options="viewToggleOptions" />
        </div>

        <AppEntityList v-if="tripsViewMode === 'list'">
            <AppEmptyListRow :show="trips.length === 0" :message="t('tripsList.empty')" />
            <q-item v-for="tr in trips" :key="String(tr.id)" class="q-pa-md">
                <q-item-section v-if="tripListProductImageUrl(tr).length > 0" avatar>
                    <q-avatar rounded size="48px">
                        <q-img :src="tripListProductImageUrl(tr)" ratio="1" fit="cover"
                            :alt="t('productsList.image')" />
                    </q-avatar>
                </q-item-section>
                <q-item-section>
                    <q-item-label class="text-h6">{{
                        productDisplayName(tr)
                        }}</q-item-label>
                    <q-item-label caption>
                        {{ t("tripsList.scheduledDeparture") }}:
                        {{ formatDeparture(tr) }}
                        <template v-if="tr.capacity != null">
                            · {{ t("tripsList.capacity") }}: {{ tr.capacity }}
                        </template>
                        <template v-if="tr.boatTypeName">
                            · {{ t("tripsList.boatType") }}:
                            {{ tr.boatTypeName }}
                        </template>
                        <template v-if="tr.waterRouteName">
                            · {{ t("tripsList.waterRoute") }}:
                            {{ tr.waterRouteName }}
                        </template>
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-btn color="primary" outline dense :label="t('common.edit')"
                        @click="tripModalRef?.openEditModal(String(tr.id))" />
                </q-item-section>
            </q-item>
        </AppEntityList>

        <div v-if="tripsViewMode !== 'list'" class="trips-calendar">
            <QCalendarDay v-if="tripsViewMode !== 'month'" ref="dayCalendarRef" v-model="selectedDateStr"
                :view="tripsViewMode === 'day' ? 'day' : 'week'" bordered :locale="dateLocale"
                :weekdays="calendarWeekdays" hour24-format interval-minutes="30" interval-count="48"
                interval-height="22" date-header="stacked" column-header-after :use-navigation="false"
                class="trips-calendar-surface" @click-time="onDayCalendarClickTime">
                <template #column-header-after="{ scope }">
                    <div v-if="isValidServiceDateYmd(scope.timestamp.date)"
                        class="trips-cal-col-header-after q-px-xs q-pb-xs">
                        <AppTripsCalendarDayHeaderActions :disabled="programId.length === 0"
                            :template-days="templateDayMenuOptions" @apply="
                                onApplyTemplateDay($event, scope.timestamp.date)
                                " @clear-unbooked="
                                confirmClearUnbookedForDay(scope.timestamp.date)
                                " />
                    </div>
                </template>
                <template #day-body="{ scope }">
                    <div class="trips-cal-day-body">
                        <div v-for="ev in eventsForDay(scope.timestamp.date)" :key="ev.id" class="trips-cal-event-wrap"
                            :style="eventPositionStyle(scope, ev)">
                            <q-btn dense no-caps padding="xs sm" outline color="primary"
                                class="trips-cal-event-btn full-width text-left" @click.stop="onTripClick(ev.id)">
                                <span class="ellipsis block">{{ ev.title }}</span>
                            </q-btn>
                        </div>
                    </div>
                </template>
            </QCalendarDay>

            <QCalendarMonth v-else ref="monthCalendarRef" v-model="selectedDateStr" bordered :locale="dateLocale"
                :weekdays="calendarWeekdays" :use-navigation="false" class="trips-calendar-surface"
                @click-day="onMonthCalendarClickDay">
                <template #day="{ scope }">
                    <div v-if="!scope.outside" class="trips-cal-month-day column q-gutter-xs q-pa-xs">
                        <q-btn v-for="ev in eventsForDay(scope.timestamp.date)" :key="ev.id" dense no-caps size="sm"
                            outline color="primary" class="trips-cal-month-event full-width text-left"
                            @click.stop="onTripClick(ev.id)">
                            <span class="ellipsis block">{{ ev.title }}</span>
                        </q-btn>
                    </div>
                </template>
            </QCalendarMonth>
        </div>
        <AppTripUpsertModal ref="tripModalRef" route-name="trips" />
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { ulid } from "ulid";
import { QCalendarDay, QCalendarMonth, today } from "@quasar/quasar-ui-qcalendar";
import { useQuasar } from "quasar";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import { joinTripsWithRelationsFrom } from "../powersync/joined-queries";
import {
    buildProgramBookedTripIdsQuery,
    reduceBookedTripIds,
} from "../powersync/trips-queries";
import type { ProgramOutput } from "../powersync/programs.collection";
import { mediaObjectPublicUrl } from "../utilities/media-url";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import type { TemplateDaySlotOutput } from "../powersync/template-day-slots.collection";
import type { TemplateDayOutput } from "../powersync/template-days.collection";
import {
    composeLocalDatetimeFromParts,
    localDatetimeInputValueToIso,
} from "../utilities/datetime-input";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";
import AppTripUpsertModal from "../components/organisms/AppTripUpsertModal.vue";
import AppTripsCalendarDayHeaderActions from "../components/molecules/AppTripsCalendarDayHeaderActions.vue";
import {
    isValidCalendarDateYmd,
    isValidTimeHm,
    roundDepartureToNearestMinutes,
} from "../utilities/trip-departure-query";
import {
    assignOverlappingIntervalColumnLayout,
    computeDayCalendarEventPositionStyle,
    normalizeCalendarEventDurationMinutes,
    type DayCalendarLayoutColumns,
} from "../utilities/day-calendar-event-layout";

const powersync = getAppPowerSyncContext();

const { t, locale } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const { confirm } = useConfirmDialog();

const tripsCollection = powersync.collections.trips;
const productsCollection = powersync.collections.products;
const boatTypesCollection = powersync.collections.boat_types;
const waterRoutesCollection = powersync.collections.water_routes;
const bookingsCollection = powersync.collections.bookings;
const templateDaysCollection = powersync.collections.template_days;
const templateDaySlotsCollection = powersync.collections.template_day_slots;
const programsCollection = powersync.collections.programs;

const { data: programRowsRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return queryBuilder.from({ p: col }).where(({ p }) => eq(p.id, pid));
    },
    [programsCollection, powersync.activeProgramIdRef],
);

const programDateBounds = computed((): { startYmd: string; endYmd: string } => {
    const row = (programRowsRaw.value ?? [])[0] as ProgramOutput | undefined;
    const s = row != null ? String(row.start_date ?? "").trim() : "";
    const e = row != null ? String(row.end_date ?? "").trim() : "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s) && /^\d{4}-\d{2}-\d{2}$/.test(e)) {
        return { startYmd: s, endYmd: e };
    }
    return { startYmd: "1970-01-01", endYmd: "9999-12-31" };
});

const { data: bookedTripIdRows } = useLiveQuery(
    (queryBuilder) => {
        const col = bookingsCollection.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return buildProgramBookedTripIdsQuery(queryBuilder, col, pid);
    },
    [bookingsCollection, powersync.activeProgramIdRef],
);

const { data: productsRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = productsCollection.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return queryBuilder
            .from({ p: col })
            .where(({ p }) => eq(p.program_id, pid))
            .orderBy(({ p }) => p.id, "asc");
    },
    [productsCollection, powersync.activeProgramIdRef],
);

const bookedTripIds = computed(() =>
    reduceBookedTripIds(bookedTripIdRows.value ?? []),
);

const { data: tripsRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = tripsCollection.value;
        const pCol = productsCollection.value;
        const btCol = boatTypesCollection.value;
        const wrCol = waterRoutesCollection.value;

        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || !pCol || !btCol || !wrCol || pid.length === 0) return undefined;
        return joinTripsWithRelationsFrom(queryBuilder, col, pCol, btCol, wrCol)
            .where(({ trip }: Record<string, Record<string, unknown>>) =>
                eq(trip.program_id, pid),
            )
            .select(({ trip, product, boatType, waterRoute }) => ({
                id: trip.id,
                program_id: trip.program_id,
                product_id: trip.product_id,
                product_name: product.name,
                scheduled_departure_at: trip.scheduled_departure_at,
                boat_type_id: product.boat_type_id,
                water_route_id: product.water_route_id,
                capacity: product.capacity,
                boatTypeName: boatType.name,
                waterRouteName: waterRoute.name,
                waterRouteDurationMinutes: waterRoute.duration_minutes,
                productBannerObjectKey: product.banner_object_key,
            }))
            .orderBy(
                ({ scheduled_departure_at }: Record<string, unknown>) =>
                    scheduled_departure_at,
                "desc",
            )
            .orderBy(({ id }: Record<string, unknown>) => id, "desc");
    },
    [
        tripsCollection,
        productsCollection,
        boatTypesCollection,
        waterRoutesCollection,
        powersync.activeProgramIdRef,
    ],
);

const { data: templateDaysRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = templateDaysCollection.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ td: col })
            .where(({ td }) => eq(td.program_id, pid))
            .orderBy(({ td }) => td.id, "desc");
    },
    [templateDaysCollection, powersync.activeProgramIdRef],
);

const { data: templateSlotsRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = templateDaySlotsCollection.value;
        if (!col) return undefined;
        return queryBuilder.from({ s: col });
    },
    [templateDaySlotsCollection],
);

const templateDaysList = computed(
    () => (templateDaysRaw.value ?? []) as TemplateDayOutput[],
);

const templateDayIds = computed(() => {
    const set = new Set<string>();
    for (const td of templateDaysList.value) {
        set.add(String(td.id));
    }
    return set;
});

const templateDayMenuOptions = computed(() => {
    const list = templateDaysList.value.map((td) => ({
        id: String(td.id),
        name: String(td.name ?? "Untitled"),
    }));
    list.sort((a, b) =>
        a.name.localeCompare(b.name, locale.value, { sensitivity: "base" }),
    );
    return list;
});

const slotsByTemplateDayId = computed(() => {
    const map = new Map<string, TemplateDaySlotOutput[]>();
    const allowed = templateDayIds.value;
    for (const row of templateSlotsRaw.value ?? []) {
        const slot = row as TemplateDaySlotOutput;
        const tid = slot.template_day_id;
        if (tid == null || String(tid).trim() === "") {
            continue;
        }
        const idStr = String(tid);
        if (!allowed.has(idStr)) {
            continue;
        }
        const list = map.get(idStr) ?? [];
        list.push(slot);
        map.set(idStr, list);
    }
    for (const list of map.values()) {
        list.sort(
            (a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
        );
    }
    return map;
});

/** Row shape from `joinTripsWithRelations` live query (virtual columns included). */
interface TripCalendarRow {
    id: unknown;
    product_name?: unknown;
    scheduled_departure_at?: unknown;
    capacity?: unknown;
    boatTypeName?: unknown;
    waterRouteName?: unknown;
    waterRouteDurationMinutes?: unknown;
    productBannerObjectKey?: unknown;
}

interface ProductLookupRow {
    id: unknown;
    capacity?: unknown;
    boat_type_id?: unknown;
    water_route_id?: unknown;
}

interface TripCalendarEventBase {
    id: string;
    title: string;
    /** Local calendar date `YYYY-MM-DD`. */
    date: string;
    /** `HH:mm` (24h) for QCalendar interval positioning. */
    time: string;
    start: Date;
    /** Epoch ms at departure (for overlap column layout). */
    startMs: number;
    /** Bar height in minutes (from water route duration). */
    durationMinutes: number;
}

type TripCalendarEvent = TripCalendarEventBase & DayCalendarLayoutColumns;

/** QCalendar `#day-body` slot scope helpers (see `getScopeForSlot` in QCalendar). */
interface DayBodyScope {
    timestamp: { date: string };
    timeStartPos: (time: string, clamp?: boolean) => number | false;
    timeDurationHeight: (minutes: number) => number;
}

const trips = computed(() => {
    const rows = (tripsRaw.value ?? []) as TripCalendarRow[];
    const { startYmd, endYmd } = programDateBounds.value;
    return rows.filter((tr) => {
        const raw = tr.scheduled_departure_at;
        if (raw == null || String(raw).trim() === "") {
            return true;
        }
        const d = new Date(String(raw));
        if (Number.isNaN(d.getTime())) {
            return true;
        }
        const y = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return y >= startYmd && y <= endYmd;
    });
});
const programProducts = computed(
    () => (productsRaw.value ?? []) as ProductLookupRow[],
);

function productDisplayName(tr: TripCalendarRow): string {
    const name = String(tr.product_name ?? "").trim();
    if (name.length > 0) {
        return name;
    }
    return t("productsList.untitled");
}

function tripListProductImageUrl(tr: TripCalendarRow): string {
    const k = tr.productBannerObjectKey;
    return mediaObjectPublicUrl(
        k == null || String(k).trim() === "" ? null : String(k),
    );
}

const programId = computed(() => String(route.params.programId ?? "").trim());

const tripModalRef = ref<InstanceType<typeof AppTripUpsertModal> | null>(null);

const dateLocale = computed(() =>
    locale.value === "fr" ? "fr-CA" : "en-CA",
);

const calendarWeekdays = computed(() =>
    locale.value === "fr" ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6],
);

type TripsViewMode = "day" | "week" | "month" | "list";

function queryParamToString(raw: unknown): string {
    if (Array.isArray(raw)) {
        return String(raw[0] ?? "").trim();
    }
    return String(raw ?? "").trim();
}

function normalizeTripsView(raw: unknown): TripsViewMode {
    const v = queryParamToString(raw).toLowerCase();
    if (
        v === "day" ||
        v === "week" ||
        v === "month" ||
        v === "list"
    ) {
        return v;
    }
    return "week";
}

const tripsViewMode = computed({
    get(): TripsViewMode {
        return normalizeTripsView(route.query.view);
    },
    set(next: TripsViewMode) {
        void router.replace({
            name: "trips",
            params: {
                programId: String(route.params.programId ?? "").trim(),
            },
            query: {
                ...route.query,
                view: next,
            },
        });
    },
});

watch(
    () => [route.name, route.query.view] as const,
    () => {
        if (route.name !== "trips") {
            return;
        }
        const str = queryParamToString(route.query.view).toLowerCase();
        const allowed: TripsViewMode[] = ["day", "week", "month", "list"];
        if (str === "") {
            void router.replace({
                name: "trips",
                params: {
                    programId: String(route.params.programId ?? "").trim(),
                },
                query: { ...route.query, view: "week" },
            });
            return;
        }
        if (!allowed.includes(str as TripsViewMode)) {
            void router.replace({
                name: "trips",
                params: {
                    programId: String(route.params.programId ?? "").trim(),
                },
                query: { ...route.query, view: "week" },
            });
        }
    },
    { immediate: true },
);

function clampProgramYmd(ymd: string): string {
    const { startYmd, endYmd } = programDateBounds.value;
    if (ymd < startYmd) {
        return startYmd;
    }
    if (ymd > endYmd) {
        return endYmd;
    }
    return ymd;
}

const selectedDateStr = ref(clampProgramYmd(today()));

watch(
    () => [programDateBounds.value.startYmd, programDateBounds.value.endYmd] as const,
    () => {
        selectedDateStr.value = clampProgramYmd(selectedDateStr.value);
    },
);

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
    { label: t("tripsCalendar.viewList"), value: "list" as const },
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
    if (tripsViewMode.value === "list") {
        return "";
    }
    const d = parseYmd(selectedDateStr.value);
    const fmt = new Intl.DateTimeFormat(dateLocale.value, { dateStyle: "medium" });
    if (tripsViewMode.value === "day") {
        return new Intl.DateTimeFormat(dateLocale.value, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        }).format(d);
    }
    if (tripsViewMode.value === "week") {
        const s = startOfWeekDate(d, mondayFirstWeek.value);
        const e = endOfWeekDate(s);
        return `${fmt.format(s)} – ${fmt.format(e)}`;
    }
    return new Intl.DateTimeFormat(dateLocale.value, {
        month: "long",
        year: "numeric",
    }).format(d);
});

function formatDeparture(tr: { scheduled_departure_at?: unknown }): string {
    const raw = tr.scheduled_departure_at;
    if (raw == null || String(raw) === "") {
        return "—";
    }
    const d = new Date(String(raw));
    if (Number.isNaN(d.getTime())) {
        return String(raw);
    }
    return new Intl.DateTimeFormat(locale.value === "fr" ? "fr-CA" : "en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(d);
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

function addMonthsClampYmd(ymd: string, delta: number): string {
    const d = parseYmd(ymd);
    d.setMonth(d.getMonth() + delta);
    return clampProgramYmd(toYmd(d));
}

function stepProgramCalendar(direction: -1 | 1): string {
    const mode = tripsViewMode.value;
    if (mode === "list") {
        return selectedDateStr.value;
    }
    const cur = selectedDateStr.value;
    if (mode === "day") {
        const d = parseYmd(cur);
        d.setDate(d.getDate() + direction);
        return clampProgramYmd(toYmd(d));
    }
    if (mode === "week") {
        const d = parseYmd(cur);
        d.setDate(d.getDate() + 7 * direction);
        return clampProgramYmd(toYmd(d));
    }
    return addMonthsClampYmd(cur, direction);
}

const canCalendarPrev = computed(
    () =>
        tripsViewMode.value !== "list" &&
        stepProgramCalendar(-1) !== selectedDateStr.value,
);

const canCalendarNext = computed(
    () =>
        tripsViewMode.value !== "list" &&
        stepProgramCalendar(1) !== selectedDateStr.value,
);

function calendarPrev(): void {
    if (tripsViewMode.value === "list") {
        return;
    }
    selectedDateStr.value = stepProgramCalendar(-1);
}

function calendarNext(): void {
    if (tripsViewMode.value === "list") {
        return;
    }
    selectedDateStr.value = stepProgramCalendar(1);
}

function calendarToday(): void {
    if (tripsViewMode.value === "list") {
        return;
    }
    selectedDateStr.value = clampProgramYmd(today());
}

const tripEvents = computed<TripCalendarEventBase[]>(() => {
    const out: TripCalendarEventBase[] = [];
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
            startMs: start.getTime(),
            durationMinutes: normalizeCalendarEventDurationMinutes(
                tr.waterRouteDurationMinutes,
            ),
        });
    }
    return out;
});

const eventsByDate = computed(() => {
    const map = new Map<string, TripCalendarEventBase[]>();
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
    const list = eventsByDate.value.get(date) ?? [];
    return assignOverlappingIntervalColumnLayout(list);
}

function isValidServiceDateYmd(raw: unknown): boolean {
    if (raw == null || typeof raw !== "string") {
        return false;
    }
    const trimmed = raw.trim();
    if (!isValidCalendarDateYmd(trimmed)) {
        return false;
    }
    const { startYmd, endYmd } = programDateBounds.value;
    return trimmed >= startYmd && trimmed <= endYmd;
}

function slotDepartureTimeToHm(raw: unknown): string {
    if (raw == null) {
        return "";
    }
    const t = String(raw).trim();
    if (t.length >= 5 && t[2] === ":") {
        return t.slice(0, 5);
    }
    return t;
}

function normalizeRefId(raw: unknown): string | null {
    if (raw == null || String(raw).trim() === "") {
        return null;
    }
    return String(raw);
}

function normalizeCapacity(raw: unknown): number | null {
    if (raw == null || raw === "") {
        return null;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
        return null;
    }
    return n;
}

function findMatchingProductIdForSlot(slot: TemplateDaySlotOutput): string | null {
    const slotCapacity = normalizeCapacity(slot.capacity);
    const slotBoatTypeId = normalizeRefId(slot.boat_type_id);
    const slotWaterRouteId = normalizeRefId(slot.water_route_id);

    if (slotCapacity == null || slotCapacity < 1) {
        return null;
    }

    const matchingProduct = programProducts.value.find((product) => {
        const capacity = normalizeCapacity(product.capacity);
        const boatTypeId = normalizeRefId(product.boat_type_id);
        const waterRouteId = normalizeRefId(product.water_route_id);

        return (
            capacity === slotCapacity &&
            boatTypeId === slotBoatTypeId &&
            waterRouteId === slotWaterRouteId
        );
    });

    if (!matchingProduct || String(matchingProduct.id).trim() === "") {
        return null;
    }

    return String(matchingProduct.id);
}

function onApplyTemplateDay(
    templateDayId: string,
    serviceDateRaw: unknown,
): void {
    if (templateDayId.trim() === "") {
        return;
    }
    const serviceDate =
        typeof serviceDateRaw === "string" ? serviceDateRaw.trim() : "";
    if (!isValidCalendarDateYmd(serviceDate)) {
        return;
    }
    const { startYmd, endYmd } = programDateBounds.value;
    if (serviceDate < startYmd || serviceDate > endYmd) {
        return;
    }
    void applyTemplateDayFromSlots(templateDayId, serviceDate);
}

async function applyTemplateDayFromSlots(
    templateDayId: string,
    serviceDate: string,
): Promise<void> {
    const pid = programId.value.trim();
    if (pid.length === 0) {
        return;
    }
    const slots = slotsByTemplateDayId.value.get(templateDayId) ?? [];
    if (slots.length === 0) {
        $q.notify({
            type: "info",
            message: t("tripsCalendar.applyTemplateDayEmptySlots"),
        });
        return;
    }
    const col = tripsCollection.value;
    if (!col) {
        $q.notify({
            type: "negative",
            message: t("tripsCalendar.applyTemplateDayErrorGeneric"),
        });
        return;
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const slot of slots) {
        const timeHm = slotDepartureTimeToHm(slot.departure_time);
        if (!isValidTimeHm(timeHm)) {
            skippedCount += 1;
            continue;
        }
        const cap = slot.capacity;
        if (
            cap == null ||
            typeof cap !== "number" ||
            !Number.isInteger(cap) ||
            cap < 1
        ) {
            skippedCount += 1;
            continue;
        }
        const localCombined = composeLocalDatetimeFromParts(
            serviceDate,
            timeHm,
        );
        const iso = localDatetimeInputValueToIso(localCombined);
        const tripId = ulid();
        const productId = findMatchingProductIdForSlot(slot);
        if (productId == null) {
            skippedCount += 1;
            continue;
        }
        try {
            await col
                .insert({
                    id: tripId,
                    program_id: pid,
                    product_id: productId,
                    scheduled_departure_at: iso,
                })
                .isPersisted.promise;
            createdCount += 1;
        } catch {
            skippedCount += 1;
        }
    }

    void powersync.refreshOutboxSnapshot();

    if (createdCount === 0) {
        $q.notify({
            type: skippedCount > 0 ? "warning" : "info",
            message:
                skippedCount > 0
                    ? t("tripsCalendar.applyTemplateDayPartialSkipped", {
                        created: createdCount,
                        skipped: skippedCount,
                    })
                    : t("tripsCalendar.applyTemplateDayEmptySlots"),
        });
        return;
    }

    if (skippedCount > 0) {
        $q.notify({
            type: "warning",
            message: t("tripsCalendar.applyTemplateDayPartialSkipped", {
                created: createdCount,
                skipped: skippedCount,
            }),
        });
        return;
    }

    $q.notify({
        type: "positive",
        message: t("tripsCalendar.applyTemplateDaySuccess", {
            created: createdCount,
        }),
    });
}

function buildEventTitle(tr: TripCalendarRow, departure: Date): string {
    const timeFmt = new Intl.DateTimeFormat(dateLocale.value, {
        timeStyle: "short",
    }).format(departure);

    const parts: string[] = [timeFmt, productDisplayName(tr)];

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
    return computeDayCalendarEventPositionStyle(scope, {
        time: ev.time,
        columnIndex: ev.columnIndex,
        columnCount: ev.columnCount,
        intervalMinutes: ev.durationMinutes,
    });
}

function confirmClearUnbookedForDay(dateStr: string): void {
    const pid = programId.value.trim();
    if (pid.length === 0) {
        return;
    }
    if (!isValidCalendarDateYmd(dateStr)) {
        return;
    }
    confirm({
        title: t("tripsCalendar.clearUnbookedConfirmTitle"),
        message: t("tripsCalendar.clearUnbookedConfirmMessage", {
            date: dateStr,
        }),
        onOk: async () => {
            const col = tripsCollection.value;
            if (!col) {
                $q.notify({
                    type: "negative",
                    message: t("tripsCalendar.clearUnbookedErrorGeneric"),
                });
                return;
            }

            const dayTripIds = tripEvents.value
                .filter((ev) => ev.date === dateStr)
                .map((ev) => ev.id);

            if (dayTripIds.length === 0) {
                $q.notify({
                    type: "info",
                    message: t("tripsCalendar.clearUnbookedNothingToDo"),
                });
                return;
            }

            const booked = bookedTripIds.value;
            const toDelete = dayTripIds.filter((id) => !booked.has(id));
            const skippedCount = dayTripIds.length - toDelete.length;

            let deletedCount = 0;
            let failedCount = 0;

            try {
                for (const id of toDelete) {
                    try {
                        await col.delete(id).isPersisted.promise;
                        deletedCount += 1;
                    } catch {
                        failedCount += 1;
                    }
                }
                void powersync.refreshOutboxSnapshot();

                if (failedCount > 0) {
                    $q.notify({
                        type: "warning",
                        message: t(
                            "tripsCalendar.clearUnbookedSomeDeletesFailed",
                            {
                                deleted: deletedCount,
                                skipped: skippedCount,
                                failed: failedCount,
                            },
                        ),
                    });
                    return;
                }

                $q.notify({
                    type: "positive",
                    message: t("tripsCalendar.clearUnbookedSuccess", {
                        deleted: deletedCount,
                        skipped: skippedCount,
                    }),
                });
            } catch (e) {
                console.error(e);
                $q.notify({
                    type: "negative",
                    message: t("tripsCalendar.clearUnbookedErrorGeneric"),
                });
            }
        },
    });
}

/** QCalendar `click-time` payload (interval cell). */
interface CalendarClickTimePayload {
    scope?: { timestamp?: Record<string, unknown> };
}

function timestampToDepartureParts(
    ts: Record<string, unknown>,
): { date: string; time: string } | null {
    const dateRaw =
        ts.date != null && String(ts.date).trim() !== ""
            ? String(ts.date).trim()
            : "";
    if (!isValidCalendarDateYmd(dateRaw)) {
        return null;
    }
    let timeStr = "";
    if (
        ts.hasTime === true &&
        ts.time != null &&
        String(ts.time).trim() !== ""
    ) {
        const t = String(ts.time).trim().slice(0, 5);
        timeStr = isValidTimeHm(t) ? t : "";
    }
    if (timeStr === "") {
        const h = typeof ts.hour === "number" ? ts.hour : null;
        const m = typeof ts.minute === "number" ? ts.minute : null;
        if (h != null && m != null) {
            const hh = String(Math.max(0, Math.min(23, h))).padStart(2, "0");
            const mm = String(Math.max(0, Math.min(59, m))).padStart(2, "0");
            timeStr = `${hh}:${mm}`;
        }
    }
    if (!isValidTimeHm(timeStr)) {
        return null;
    }

    return roundDepartureToNearestMinutes(dateRaw, timeStr, 15);
}

function onTripClick(id: string): void {
    if (id.length === 0) {
        return;
    }
    tripModalRef.value?.openEditModal(id);
}

function onDayCalendarClickTime(payload: CalendarClickTimePayload): void {
    const rawTs = payload.scope?.timestamp;
    if (rawTs == null || typeof rawTs !== "object") {
        return;
    }
    const parts = timestampToDepartureParts(rawTs);
    if (parts == null) {
        return;
    }
    const { startYmd, endYmd } = programDateBounds.value;
    if (parts.date < startYmd || parts.date > endYmd) {
        return;
    }
    const pid = programId.value;
    if (pid.length === 0) {
        return;
    }
    tripModalRef.value?.openCreateModal({
        departureDate: parts.date,
        departureTime: parts.time,
    });
}

/** QCalendar month `click-day` payload. */
interface MonthClickDayPayload {
    scope?: { timestamp?: { date?: string }; outside?: boolean };
}

function onMonthCalendarClickDay(payload: MonthClickDayPayload): void {
    if (payload.scope?.outside === true) {
        return;
    }
    const dateRaw =
        payload.scope?.timestamp?.date != null
            ? String(payload.scope.timestamp.date).trim()
            : "";
    if (!isValidCalendarDateYmd(dateRaw)) {
        return;
    }
    selectedDateStr.value = clampProgramYmd(dateRaw);
    tripsViewMode.value = "day";
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

.trips-calendar-surface :deep(.q-calendar-day__day-interval),
.trips-calendar-surface :deep(.q-calendar-day__day-interval--section),
.trips-calendar-surface :deep(.q-calendar-month__day) {
    cursor: pointer;
}

.trips-calendar-surface :deep(.q-calendar-month__day.disabled) {
    cursor: default;
}

.trips-cal-day-body {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.trips-cal-event-wrap {
    pointer-events: auto;
    overflow: hidden;
}

.trips-cal-event-btn {
    font-size: 0.75rem;
    height: 100%;
    min-height: 0;
}

.trips-cal-month-day {
    min-height: 3rem;
    max-height: 6.5rem;
    overflow: auto;
}

.trips-cal-month-event {
    font-size: 0.7rem;
}

.trips-cal-col-header-after {
    width: 100%;
}
</style>
