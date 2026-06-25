import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useRoute, useRouter, type LocationQuery } from "vue-router";
import { ulid } from "ulid";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import type { TripUpsertFormValues } from "../models/trips/trips.validation";
import { parseTripCreateDepartureQuery } from "../utilities/trip-departure-query";
import {
    formatIsoInTimezone,
    isoToProgramDateAndTime,
    programWallClockToIso,
    resolveProgramTimezone,
} from "../utilities/program-timezone-datetime";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import { joinTripsWithRelationsFrom, type TripWithRelationsRow } from "../powersync/joined-queries";
import { queryRef } from "../powersync/live-query-casts";
import { useConfirmDialog } from "./useConfirmDialog";
import { useNotifyAsyncAction } from "./useNotifyAsyncAction";
import { useNotifyErrorFromCatch } from "./useNotifyErrorFromCatch";

export const TRIP_MODAL_QUERY_KEY = "tripModal" as const;
export const TRIP_MODAL_TRIP_ID_QUERY_KEY = "tripId" as const;

export type TripModalBaseRouteName = "trips";

function stripTripModalKeys(query: LocationQuery): LocationQuery {
    const next: LocationQuery = { ...query };
    delete next[TRIP_MODAL_QUERY_KEY];
    delete next[TRIP_MODAL_TRIP_ID_QUERY_KEY];
    delete next.departureDate;
    delete next.departureTime;
    return next;
}

/**
 * Route-driven trip create/edit modal: reads `tripModal=create|edit` and optional
 * `tripId`, `departureDate`, `departureTime` from the current route query.
 */
export function useTripModalUpsert(
    baseRouteName: TripModalBaseRouteName,
) {
    const route = useRoute();
    const router = useRouter();
    const { t, locale } = useI18n();
    const $q = useQuasar();
    const powersync = getAppPowerSyncContext();
    const tripsCollection = powersync.collections.trips;
    const productsCollection = powersync.collections.products;
    const boatTypesCollection = powersync.collections.boat_types;
    const waterRoutesCollection = powersync.collections.water_routes;
    const programsCollection = powersync.collections.programs;
    const { runWithNotify } = useNotifyAsyncAction();
    const { confirm } = useConfirmDialog();
    const { notifyError } = useNotifyErrorFromCatch();

    const isDeleting = ref(false);

    const programId = computed(() =>
        String(route.params.programId ?? "").trim(),
    );

    const { data: programRowsRaw } = useLiveQuery(
        (queryBuilder) => {
            const col = programsCollection.value;
            const pid = programId.value;
            if (!col || pid.length === 0) {
                return undefined;
            }
            return queryBuilder.from({ p: col }).where(({ p }) => eq(p.id, pid));
        },
        [programsCollection, programId],
    );

    const programTimezone = computed((): string => {
        const row = (programRowsRaw.value ?? [])[0] as { timezone?: string | null } | undefined;

        return resolveProgramTimezone(row?.timezone);
    });

    const modalMode = computed<"create" | "edit" | null>(() => {
        const raw = String(route.query[TRIP_MODAL_QUERY_KEY] ?? "")
            .trim()
            .toLowerCase();
        if (raw === "create" || raw === "edit") {
            return raw;
        }
        return null;
    });

    const editTripId = computed(() => {
        const id = String(
            route.query[TRIP_MODAL_TRIP_ID_QUERY_KEY] ?? "",
        ).trim();
        return id.length > 0 ? id : "";
    });

    const dialogModel = computed({
        get: (): boolean => modalMode.value != null,
        set: (open: boolean): void => {
            if (!open) {
                void closeModal();
            }
        },
    });

    async function closeModal(): Promise<void> {
        if (modalMode.value == null) {
            return;
        }
        await router.replace({
            name: baseRouteName,
            params: { programId: programId.value },
            query: stripTripModalKeys(route.query),
        });
    }

    function openCreateModal(
        extra?: Partial<{ departureDate: string; departureTime: string }>,
    ): void {
        void router.push({
            name: baseRouteName,
            params: { programId: programId.value },
            query: {
                ...stripTripModalKeys(route.query),
                [TRIP_MODAL_QUERY_KEY]: "create",
                ...(extra?.departureDate != null && extra.departureDate !== ""
                    ? { departureDate: extra.departureDate }
                    : {}),
                ...(extra?.departureTime != null && extra.departureTime !== ""
                    ? { departureTime: extra.departureTime }
                    : {}),
            },
        });
    }

    function openEditModal(tripId: string): void {
        if (tripId.length === 0) {
            return;
        }
        void router.push({
            name: baseRouteName,
            params: { programId: programId.value },
            query: {
                ...stripTripModalKeys(route.query),
                [TRIP_MODAL_QUERY_KEY]: "edit",
                [TRIP_MODAL_TRIP_ID_QUERY_KEY]: tripId,
            },
        });
    }

    function replaceEditTripId(nextId: string): void {
        if (nextId.length === 0) {
            return;
        }
        void router.replace({
            name: baseRouteName,
            params: { programId: programId.value },
            query: {
                ...route.query,
                [TRIP_MODAL_QUERY_KEY]: "edit",
                [TRIP_MODAL_TRIP_ID_QUERY_KEY]: nextId,
            },
        });
    }

    const { data: tripsJoined } = useLiveQuery(
        (queryBuilder) => {
            const col = tripsCollection.value;
            const pCol = productsCollection.value;
            const btCol = boatTypesCollection.value;
            const wrCol = waterRoutesCollection.value;
            const pid = powersync.activeProgramIdRef.value.trim();
            if (!col || !pCol || !btCol || !wrCol || pid.length === 0) {
                return undefined;
            }
            return joinTripsWithRelationsFrom(queryBuilder, col, pCol, btCol, wrCol)
                .where(({ trip }) => eq(trip.program_id, pid))
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
                }));
        },
        [
            tripsCollection,
            productsCollection,
            boatTypesCollection,
            waterRoutesCollection,
            powersync.activeProgramIdRef,
        ],
    );

    const currentTrip = computed((): TripWithRelationsRow | null => {
        const id = editTripId.value;
        if (id.length === 0) {
            return null;
        }
        const rows = (tripsJoined.value ?? []) as unknown as TripWithRelationsRow[];
        return rows.find((row) => String(row.id) === id) ?? null;
    });

    const neighbors = computed(() => {
        const id = editTripId.value;
        const list = (tripsJoined.value ?? []) as unknown as TripWithRelationsRow[];
        const ids = list.map((t) => String(t.id));
        const idx = id.length === 0 ? -1 : ids.indexOf(id);
        if (idx < 0) {
            return { prev: null, next: null, index: -1, total: ids.length };
        }
        return {
            prev: idx > 0 ? String(ids[idx - 1]) : null,
            next: idx < ids.length - 1 ? String(ids[idx + 1]) : null,
            index: idx,
            total: ids.length,
        };
    });

    const hasBootstrapped = powersync.hasBootstrappedCollection;

    const showNotFound = computed(
        () =>
            modalMode.value === "edit" &&
            hasBootstrapped.value &&
            editTripId.value.length > 0 &&
            currentTrip.value == null,
    );

    const tripCreateSeed = computed((): Partial<TripUpsertFormValues> | null => {
        if (modalMode.value !== "create") {
            return null;
        }
        const parsed = parseTripCreateDepartureQuery(route.query);
        if (parsed == null) {
            return null;
        }
        return {
            scheduledDepartureDate: parsed.scheduledDepartureDate,
            scheduledDepartureTime: parsed.scheduledDepartureTime,
            productId: "",
        };
    });

    const tripFormSeed = computed((): Partial<TripUpsertFormValues> | null => {
        const tr = currentTrip.value;
        if (!tr) {
            return null;
        }
        const { date, time } = isoToProgramDateAndTime(
            String(tr.scheduled_departure_at ?? ""),
            programTimezone.value,
        );
        return {
            scheduledDepartureDate: date,
            scheduledDepartureTime: time,
            productId:
                tr.product_id == null || String(tr.product_id).length === 0
                    ? ""
                    : String(tr.product_id),
        };
    });

    function formatSwitcherLabel(tr: TripWithRelationsRow) {
        const raw = tr.scheduled_departure_at;
        if (raw == null || String(raw) === "") {
            return String(tr.id ?? "");
        }
        const d = new Date(String(raw));
        if (Number.isNaN(d.getTime())) {
            return String(raw);
        }
        return formatIsoInTimezone(String(raw), programTimezone.value, String(locale.value), {
            dateStyle: "medium",
            timeStyle: "short",
        });
    }

    const tripSwitcherOptions = computed(() =>
        ((tripsJoined.value ?? []) as unknown as TripWithRelationsRow[]).map((tr) => ({
            label: formatSwitcherLabel(tr),
            value: String(tr.id),
        })),
    );

    function onSwitchTrip(nextId: string | null | undefined): void {
        if (nextId == null || String(nextId) === String(editTripId.value)) {
            return;
        }
        replaceEditTripId(String(nextId));
    }

    function goPrev(): void {
        const p = neighbors.value.prev;
        if (p) {
            onSwitchTrip(p);
        }
    }

    function goNext(): void {
        const n = neighbors.value.next;
        if (n) {
            onSwitchTrip(n);
        }
    }

    async function submitCreateTrip(
        values: TripUpsertFormValues,
    ): Promise<void> {
        await runWithNotify(
            async () => {
                const col = tripsCollection.value;
                if (!col) {
                    throw new Error("Trips collection not ready.");
                }
                const pid = powersync.activeProgramIdRef.value.trim();
                if (pid.length === 0) {
                    throw new Error("Select a program before adding trips.");
                }
                const productId = String(values.productId ?? "").trim();
                if (productId.length === 0) {
                    throw new Error("Product is required.");
                }
                const tripId = ulid();
                const iso = programWallClockToIso(
                    values.scheduledDepartureDate,
                    values.scheduledDepartureTime,
                    programTimezone.value,
                );

                await col
                    .insert({
                        id: tripId,
                        program_id: pid,
                        product_id: productId,
                        scheduled_departure_at: iso,
                    })
                    .isPersisted.promise;
                void powersync.refreshOutboxSnapshot();
                await closeModal();
            },
            {
                successMessage: t("tripsList.created"),
                errorGeneric: t("tripsList.errorGeneric"),
            },
        );
    }

    async function submitUpdateTrip(
        values: TripUpsertFormValues,
    ): Promise<void> {
        const id = editTripId.value;
        if (id.length === 0) {
            return;
        }
        await runWithNotify(
            async () => {
                const tr = currentTrip.value;
                if (tr === null) {
                    throw new Error("Trip not found.");
                }
                const iso = programWallClockToIso(
                    values.scheduledDepartureDate,
                    values.scheduledDepartureTime,
                    programTimezone.value,
                );
                const nextProductId = String(values.productId ?? "").trim();
                if (nextProductId.length === 0) {
                    throw new Error("Product is required.");
                }
                const col = tripsCollection.value;
                if (!col) {
                    throw new Error("Trips collection not ready.");
                }
                col.update(id, (draft) => {
                    draft.scheduled_departure_at = iso;
                    draft.product_id = nextProductId;
                });
                void powersync.refreshOutboxSnapshot();
            },
            {
                successMessage: t("tripsList.changesSaved"),
                errorGeneric: t("tripsList.errorGeneric"),
            },
        );
    }

    function confirmDelete(): void {
        const tr = currentTrip.value;
        if (!tr) {
            return;
        }
        confirm({
            title: t("tripsList.deleteConfirmTitle"),
            message: t("tripsList.deleteConfirmMessage"),
            onOk: async () => {
                isDeleting.value = true;
                try {
                    const col = tripsCollection.value;
                    if (!col) {
                        return;
                    }
                    col.delete(String(tr.id));
                    void powersync.refreshOutboxSnapshot();
                    $q.notify({
                        type: "positive",
                        message: t("tripsList.deleted"),
                    });
                    await closeModal();
                } catch (e) {
                    notifyError(e, t("tripsList.errorGeneric"));
                } finally {
                    isDeleting.value = false;
                }
            },
        });
    }

    const modalTitle = computed(() => {
        if (modalMode.value === "create") {
            return t("tripsList.createModalTitle");
        }
        if (modalMode.value === "edit") {
            return t("tripsList.editModalTitle");
        }
        return "";
    });

    const modalDescription = computed(() => {
        if (modalMode.value === "create") {
            return t("tripsList.createModalDescription");
        }
        if (modalMode.value === "edit") {
            return t("tripsList.editModalDescription");
        }
        return "";
    });

    return {
        programId,
        modalMode,
        dialogModel,
        closeModal,
        openCreateModal,
        openEditModal,
        editTripId,
        tripCreateSeed,
        tripFormSeed,
        currentTrip,
        neighbors,
        tripSwitcherOptions,
        onSwitchTrip,
        goPrev,
        goNext,
        showNotFound,
        isDeleting,
        submitCreateTrip,
        submitUpdateTrip,
        confirmDelete,
        modalTitle,
        modalDescription,
    };
}
