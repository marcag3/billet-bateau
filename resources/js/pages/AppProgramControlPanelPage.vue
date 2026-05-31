<template>
    <q-page class="q-pa-md column control-panel-page">
        <AppPageHeader :title="t('programsControl.title')" class="q-mb-sm" />

        <AppControlPanelDayToolbar v-model:selected-date-ymd="selectedDateYmd" :stats="dayStats"
            :trip-date-ymds="tripDateYmds" :program-start-date-ymd="programDateBounds.startYmd"
            :program-end-date-ymd="programDateBounds.endYmd" @prev-day="shiftSelectedDay(-1)"
            @next-day="shiftSelectedDay(1)" @go-today="goToToday" />

        <p v-if="tripCards.length === 0" class="text-body1 text-grey-7">
            {{ t("programsControl.emptyDay") }}
        </p>

        <q-virtual-scroll
            v-else
            :items="tripCards"
            virtual-scroll-horizontal
            :virtual-scroll-item-size="tripCardItemSize"
            :style="tripLaneStyle"
            class="col w-full min-h-0 control-panel-trip-lane snap-x snap-mandatory"
            v-slot="{ item, index }"
        >
            <AppControlPanelTripCard :key="String(item.trip.id)" :card="item" @open-depart="openDepartModal(item)"
                @arrive="confirmArrive(item)" @add-passenger="(name) => onAddPassenger(item, name)"
                @remove-passenger="(id) => removePassenger(id)" @open-walk-in="openWalkInModal(item)"
                @remove-booked-ticket="(ticketId, bookingId) => onRemoveBookedTicket(item, ticketId, bookingId)" />
        </q-virtual-scroll>

        <AppControlPanelWalkInBookingDialog v-model:open="walkInDialogOpen" :ticket-type-options="ticketTypeOptions"
            :booking-questions="bookingQuestions" :booked-count="walkInCard?.bookedCount ?? 0"
            :trip-capacity="walkInTripCapacity" @confirm="onConfirmWalkIn" />

        <AppControlPanelStartVoyageModal v-model:open="departModalOpen" :boat-options="boatOptions"
            :guide-options="guideOptions" :initial-boat-ids="departCard?.initialBoatIds ?? []"
            :initial-guide-ids="departCard?.initialGuideIds ?? []" :submitting="departSubmitting"
            @confirm="onConfirmDepart" />
    </q-page>
</template>

<style scoped>
.control-panel-page {
    min-height: 0;
}

.control-panel-trip-lane {
    width: 100%;
    max-width: 100%;
}
</style>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { usePageLayout } from "../composables/usePageLayout";
import {
    useControlPanelDayBoard,
    type ControlPanelTripCardModel,
} from "../composables/useControlPanelDayBoard";
import { useControlPanelVoyageOps } from "../composables/useControlPanelVoyageOps";
import { useControlPanelWalkInBooking } from "../composables/useControlPanelWalkInBooking";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppControlPanelDayToolbar from "../components/control-panel/AppControlPanelDayToolbar.vue";
import AppControlPanelTripCard from "../components/control-panel/AppControlPanelTripCard.vue";
import AppControlPanelStartVoyageModal from "../components/control-panel/AppControlPanelStartVoyageModal.vue";
import AppControlPanelWalkInBookingDialog from "../components/control-panel/AppControlPanelWalkInBookingDialog.vue";
import type { ControlPanelSelectOption } from "../components/control-panel/AppControlPanelStartVoyageModal.vue";
import type { WalkInBookingConfirmPayload } from "../components/control-panel/AppControlPanelWalkInBookingDialog.vue";

const { t } = useI18n();
const route = useRoute();
const { confirm } = useConfirmDialog();
const powersync = getAppPowerSyncContext();

usePageLayout({ documentTitleKey: "programsControl.title" });

const programId = computed(() => String(route.params.programId ?? "").trim());

/** Space for page header, day toolbar, and padding below the trip lane. */
const TRIP_LANE_CHROME_PX = 220;

const viewportHeightPx = ref(
    typeof window !== "undefined" ? window.innerHeight : 800,
);

function syncViewportHeight(): void {
    viewportHeightPx.value = window.innerHeight;
}

onMounted(() => {
    syncViewportHeight();
    window.addEventListener("resize", syncViewportHeight, { passive: true });
});

onUnmounted(() => {
    window.removeEventListener("resize", syncViewportHeight);
});

const tripLaneHeightPx = computed(() =>
    Math.max(400, viewportHeightPx.value - TRIP_LANE_CHROME_PX),
);

const tripCardItemSize = computed(() =>
    Math.round(tripLaneHeightPx.value * (5 / 12)),
);

const tripLaneStyle = computed(() => ({
    "--trip-card-height": `${tripLaneHeightPx.value}px`,
    height: `${tripLaneHeightPx.value}px`,
}));

const {
    selectedDateYmd,
    tripCards,
    dayStats,
    tripDateYmds,
    programDateBounds,
    bookingQuestions,
    shiftSelectedDay,
    goToToday,
} = useControlPanelDayBoard(programId);

const { startDeparture, markArrival, addPassenger, removePassenger } =
    useControlPanelVoyageOps();
const { addWalkInBooking, removeWalkInBookingTicket } = useControlPanelWalkInBooking();

const boatsCollection = powersync.collections.boats;
const guidesCollection = powersync.collections.guides;
const ticketTypesCollection = powersync.collections.ticket_types;

const { data: boatsRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = boatsCollection.value;
        const pid = programId.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return queryBuilder
            .from({ b: col })
            .where(({ b }) => eq(b.program_id, pid));
    },
    [boatsCollection, programId],
);

const { data: guidesRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = guidesCollection.value;
        if (!col) {
            return undefined;
        }
        return queryBuilder.from({ g: col });
    },
    [guidesCollection],
);

const { data: ticketTypesRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = ticketTypesCollection.value;
        const pid = programId.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return queryBuilder
            .from({ tt: col })
            .where(({ tt }) => eq(tt.program_id, pid));
    },
    [ticketTypesCollection, programId],
);

const boatOptions = computed((): ControlPanelSelectOption[] => {
    return ((boatsRaw.value ?? []) as Record<string, unknown>[]).map((b) => {
        const cap = b.capacity != null ? ` (${b.capacity} pax)` : "";
        return {
            value: String(b.id),
            label: `${String(b.name ?? "")}${cap}`,
        };
    });
});

const guideOptions = computed((): ControlPanelSelectOption[] => {
    return ((guidesRaw.value ?? []) as Record<string, unknown>[]).map((g) => ({
        value: String(g.id),
        label: String(g.name ?? ""),
    }));
});

const ticketTypeOptions = computed((): ControlPanelSelectOption[] => {
    return ((ticketTypesRaw.value ?? []) as Record<string, unknown>[]).map((tt) => ({
        value: String(tt.id),
        label: String(tt.title ?? ""),
    }));
});

const departModalOpen = ref(false);
const departSubmitting = ref(false);
const departCard = ref<ControlPanelTripCardModel | null>(null);

const walkInDialogOpen = ref(false);
const walkInCard = ref<ControlPanelTripCardModel | null>(null);

const walkInTripCapacity = computed((): number | null => {
    const cap = walkInCard.value?.trip.capacity;
    if (cap == null || !Number.isFinite(Number(cap))) {
        return null;
    }
    return Number(cap);
});

function openDepartModal(card: ControlPanelTripCardModel): void {
    departCard.value = card;
    departModalOpen.value = true;
}

async function onConfirmDepart(payload: {
    boatIds: string[];
    guideIds: string[];
}): Promise<void> {
    const card = departCard.value;
    if (card == null) {
        return;
    }
    departSubmitting.value = true;
    try {
        await startDeparture({
            trip: card.trip,
            existingVoyage: card.voyage,
            boatIds: payload.boatIds,
            guideIds: payload.guideIds,
            bookingTicketsToSeed: card.bookingTickets,
            existingVoyageBoatPivotIds: card.voyageBoatPivotIds,
            existingVoyageGuidePivotIds: card.voyageGuidePivotIds,
            existingPassengerCount: card.passengers.length,
        });
        departModalOpen.value = false;
    } finally {
        departSubmitting.value = false;
    }
}

function confirmArrive(card: ControlPanelTripCardModel): void {
    const voyageId = card.voyage?.id != null ? String(card.voyage.id) : "";
    if (voyageId.length === 0) {
        return;
    }
    confirm({
        title: t("programsControl.arriveConfirmTitle"),
        message: t("programsControl.arriveConfirmMessage"),
        onOk: () => markArrival(voyageId),
    });
}

function onAddPassenger(card: ControlPanelTripCardModel, name: string): void {
    const voyageId = card.voyage?.id != null ? String(card.voyage.id) : "";
    if (voyageId.length === 0) {
        return;
    }
    void addPassenger(voyageId, name);
}

function openWalkInModal(card: ControlPanelTripCardModel): void {
    walkInCard.value = card;
    walkInDialogOpen.value = true;
}

async function onConfirmWalkIn(payload: WalkInBookingConfirmPayload): Promise<void> {
    const card = walkInCard.value;
    if (card == null) {
        return;
    }

    await addWalkInBooking({
        trip: card.trip,
        programId: programId.value,
        ticketTypeId: payload.ticketTypeId,
        contactName: payload.contactName,
        contactEmail: payload.contactEmail,
        country: payload.country,
        customFieldMap: payload.customFieldMap,
    });
}

function onRemoveBookedTicket(
    card: ControlPanelTripCardModel,
    ticketId: string,
    bookingId: string,
): void {
    const ticketsForBookingCount = card.bookingTickets.filter(
        (ticket) => String(ticket.booking_id) === bookingId,
    ).length;
    void removeWalkInBookingTicket(ticketId, bookingId, ticketsForBookingCount);
}
</script>
