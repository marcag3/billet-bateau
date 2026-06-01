<template>
    <q-page class="q-pa-md column min-h-0">
        <AppPageHeader :title="t('programsControl.title')" class="q-mb-sm" />

        <AppControlPanelDayToolbar v-model:selected-date-ymd="selectedDateYmd"
            v-model:show-finished-trips="showFinishedTrips" :stats="dayStats" :trip-date-ymds="tripDateYmds"
            :program-start-date-ymd="programDateBounds.startYmd" :program-end-date-ymd="programDateBounds.endYmd"
            @prev-day="shiftSelectedDay(-1)" @next-day="shiftSelectedDay(1)" @go-today="goToToday" />

        <p v-if="visibleTripCards.length === 0" class="text-body1 text-grey-7">
            {{ emptyDayMessage }}
        </p>

        <q-virtual-scroll v-else ref="tripLaneRef" v-touch-pan.mouse.horizontal="onTripLanePan" :items="visibleTripCards"
            virtual-scroll-horizontal :virtual-scroll-item-size="tripCardItemSize" :style="tripLaneStyle"
            class="col w-full max-w-full min-h-0 snap-x snap-mandatory" v-slot="{ item }">
            <AppControlPanelTripCard :key="String(item.trip.id)" :card="item" @open-depart="openDepartModal(item)"
                @arrive="confirmArrive(item)" @open-walk-in="openWalkInModal(item)"
                @remove-booked-ticket="(ticketId, bookingId) => onRemoveBookedTicket(item, ticketId, bookingId)"
                @undo-check-in-booking="(bookingId) => onUndoCheckInBooking(item, bookingId)"
                @remove-passenger="(passengerId) => removePassenger(passengerId)"
                @check-in-booking="(bookingId) => onCheckInBooking(item, bookingId)" />
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

<script setup lang="ts">
import { computed, ref, type ComponentPublicInstance } from "vue";
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
import { useControlPanelCheckIn } from "../composables/useControlPanelCheckIn";
import { useControlPanelUndoCheckIn } from "../composables/useControlPanelUndoCheckIn";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useControlPanelTripLaneLayout } from "../composables/useControlPanelTripLaneLayout";
import { useControlPanelTripLanePan } from "../composables/useControlPanelTripLanePan";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppControlPanelDayToolbar from "../components/control-panel/AppControlPanelDayToolbar.vue";
import AppControlPanelTripCard from "../components/control-panel/AppControlPanelTripCard.vue";
import AppControlPanelStartVoyageModal from "../components/control-panel/AppControlPanelStartVoyageModal.vue";
import AppControlPanelWalkInBookingDialog from "../components/control-panel/AppControlPanelWalkInBookingDialog.vue";
import type { ControlPanelSelectOption } from "../components/control-panel/AppControlPanelStartVoyageModal.vue";
import type { WalkInBookingConfirmPayload } from "../components/control-panel/AppControlPanelWalkInBookingDialog.vue";
import { isControlPanelTripFinished } from "../utilities/control-panel-day-board";

const { t } = useI18n();
const route = useRoute();
const { confirm } = useConfirmDialog();
const powersync = getAppPowerSyncContext();

usePageLayout({ documentTitleKey: "programsControl.title" });

const programId = computed(() => String(route.params.programId ?? "").trim());

const tripLaneRef = ref<ComponentPublicInstance | null>(null);

const { tripCardItemSize, tripLaneStyle } = useControlPanelTripLaneLayout();
const { onTripLanePan } = useControlPanelTripLanePan(tripLaneRef);

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

const showFinishedTrips = ref(false);

const visibleTripCards = computed(() => {
    if (showFinishedTrips.value) {
        return tripCards.value;
    }
    return tripCards.value.filter((card) => !isControlPanelTripFinished(card.voyage));
});

const emptyDayMessage = computed((): string => {
    if (tripCards.value.length > 0 && visibleTripCards.value.length === 0) {
        return t("programsControl.allTripsFinishedHidden");
    }
    return t("programsControl.emptyDay");
});

const { startDeparture, markArrival, removePassenger } = useControlPanelVoyageOps();
const { addWalkInBooking, removeWalkInBookingTicket } = useControlPanelWalkInBooking();
const { checkInBooking } = useControlPanelCheckIn();
const { undoCheckInForBooking } = useControlPanelUndoCheckIn();

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
            existingVoyageBoatPivotIds: card.voyageBoatPivotIds,
            existingVoyageGuidePivotIds: card.voyageGuidePivotIds,
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

function openWalkInModal(card: ControlPanelTripCardModel): void {
    walkInCard.value = card;
    walkInDialogOpen.value = true;
}

async function onConfirmWalkIn(payload: WalkInBookingConfirmPayload): Promise<void> {
    const card = walkInCard.value;
    if (card == null) {
        return;
    }

    const result = await addWalkInBooking({
        trip: card.trip,
        programId: programId.value,
        ticketTypeId: payload.ticketTypeId,
        contactName: payload.contactName,
        contactEmail: payload.contactEmail,
        country: payload.country,
        customFieldMap: payload.customFieldMap,
    });

    if (result == null || card.voyage == null) {
        return;
    }

    void checkInBooking({
        card,
        bookingId: result.bookingId,
        tickets: [...card.bookingTickets, result.ticket],
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

function onCheckInBooking(card: ControlPanelTripCardModel, bookingId: string): void {
    void checkInBooking({
        card,
        bookingId,
        tickets: card.bookingTickets,
    });
}

function onUndoCheckInBooking(
    card: ControlPanelTripCardModel,
    bookingId: string,
): void {
    void undoCheckInForBooking(bookingId, card.passengers);
}
</script>
