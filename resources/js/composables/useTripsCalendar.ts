import { computed, ref, watch, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { ulid } from "ulid";
import { today } from "@timestamp-js/core";
import { useQuasar } from "quasar";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import { liveQueryRow, liveQueryRows, queryRef } from "../powersync/live-query-casts";
import { joinTripsWithRelationsFrom } from "../powersync/joined-queries";
import {
    buildProgramBookedTripIdsQuery,
    reduceBookedTripIds,
    type BookedTripIdRow,
} from "../powersync/trips-queries";
import type { ProgramOutput } from "../powersync/programs.collection";
import { mediaObjectPublicUrl } from "../utilities/media-url";
import { useConfirmDialog } from "./useConfirmDialog";
import type { TemplateDaySlotOutput } from "../powersync/template-day-slots.collection";
import type { TemplateDayOutput } from "../powersync/template-days.collection";
import {
    formatIsoInTimezone,
    programWallClockToIso,
    resolveProgramTimezone,
} from "../utilities/program-timezone-datetime";
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

/** Subset of `AppTripUpsertModal` exposed API used by the trips page. */
export interface TripUpsertModalHandle {
    openCreateModal: (prefill?: { departureDate?: string; departureTime?: string }) => void;
    openEditModal: (tripId: string) => void;
}

/** Row shape from `joinTripsWithRelations` live query (virtual columns included). */
export interface TripCalendarRow {
    id: unknown;
    product_name?: unknown;
    scheduled_departure_at?: unknown;
    capacity?: unknown;
    boatTypeName?: unknown;
    waterRouteName?: unknown;
    waterRouteDurationMinutes?: unknown;
    productBannerObjectKey?: unknown;
}

export interface ProductLookupRow {
    id: unknown;
    capacity?: unknown;
    boat_type_id?: unknown;
    water_route_id?: unknown;
}

export interface TripCalendarEventBase {
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

export type TripCalendarEvent = TripCalendarEventBase & DayCalendarLayoutColumns;

/** QCalendar `#day-body` slot scope helpers (see `getScopeForSlot` in QCalendar). */
export interface DayBodyScope {
    timestamp: { date: string };
    timeStartPos: (time: string, clamp?: boolean) => number | false;
    timeDurationHeight: (minutes: number) => number;
}

export type TripsViewMode = "day" | "week" | "month" | "list";

/** QCalendar `click-time` payload (interval cell). */
export interface CalendarClickTimePayload {
    scope?: { timestamp?: Record<string, unknown> };
}

/** QCalendar month `click-day` payload. */
export interface MonthClickDayPayload {
    scope?: { timestamp?: { date?: string }; outside?: boolean };
}

/**
 * Trips page state: program-scoped trip/template-day live queries, calendar
 * navigation driven by the `view` route query, and template-day apply / clear-unbooked actions.
 */
export function useTripsCalendar(tripModalRef: Ref<TripUpsertModalHandle | null>) {
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
        const row = liveQueryRow<ProgramOutput>((programRowsRaw.value ?? [])[0]);
        const s = row != null ? String(row.start_date ?? "").trim() : "";
        const e = row != null ? String(row.end_date ?? "").trim() : "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(s) && /^\d{4}-\d{2}-\d{2}$/.test(e)) {
            return { startYmd: s, endYmd: e };
        }
        return { startYmd: "1970-01-01", endYmd: "9999-12-31" };
    });

    const programTimezone = computed((): string => {
        const row = liveQueryRow<ProgramOutput>((programRowsRaw.value ?? [])[0]);

        return resolveProgramTimezone(row?.timezone);
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
        reduceBookedTripIds(liveQueryRows<BookedTripIdRow>(bookedTripIdRows.value)),
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
                    id: queryRef(trip).id,
                    program_id: queryRef(trip).program_id,
                    product_id: queryRef(trip).product_id,
                    product_name: queryRef(product).name,
                    scheduled_departure_at: queryRef(trip).scheduled_departure_at,
                    boat_type_id: queryRef(product).boat_type_id,
                    water_route_id: queryRef(product).water_route_id,
                    capacity: queryRef(product).capacity,
                    boatTypeName: queryRef(boatType).name,
                    waterRouteName: queryRef(waterRoute).name,
                    waterRouteDurationMinutes: queryRef(waterRoute).duration_minutes,
                    productBannerObjectKey: queryRef(product).banner_object_key,
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

    const templateDaysList = computed(() =>
        liveQueryRows<TemplateDayOutput>(templateDaysRaw.value),
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
        for (const row of liveQueryRows<TemplateDaySlotOutput>(templateSlotsRaw.value)) {
            const slot = row;
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


    const trips = computed(() => {
        const rows = liveQueryRows<TripCalendarRow>(tripsRaw.value);
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
    const programProducts = computed(() =>
        liveQueryRows<ProductLookupRow>(productsRaw.value),
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

    const dateLocale = computed(() =>
        locale.value === "fr" ? "fr-CA" : "en-CA",
    );

    const calendarWeekdays = computed(() =>
        locale.value === "fr" ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6],
    );


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
        return formatIsoInTimezone(String(raw), programTimezone.value, locale.value === "fr" ? "fr-CA" : "en-CA", {
            dateStyle: "medium",
            timeStyle: "short",
        });
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
            const iso = programWallClockToIso(serviceDate, timeHm, programTimezone.value);
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
            durationMinutes: ev.durationMinutes,
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

    return {
        t,
        programId,
        trips,
        templateDayMenuOptions,
        dateLocale,
        calendarWeekdays,
        tripsViewMode,
        selectedDateStr,
        viewToggleOptions,
        calendarTitle,
        canCalendarPrev,
        canCalendarNext,
        calendarPrev,
        calendarNext,
        calendarToday,
        productDisplayName,
        tripListProductImageUrl,
        formatDeparture,
        eventsForDay,
        eventPositionStyle,
        isValidServiceDateYmd,
        onApplyTemplateDay,
        confirmClearUnbookedForDay,
        onTripClick,
        onDayCalendarClickTime,
        onMonthCalendarClickDay,
    };
}
