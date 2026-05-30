<template>
    <q-page class="q-pa-md">
        <AppPageHeader :title="t('programsControl.title')" class="q-mb-sm" />

        <AppControlPanelDayToolbar v-model:selected-date-ymd="selectedDateYmd" :stats="dayStats"
            :trip-date-ymds="tripDateYmds" :program-start-date-ymd="programDateBounds.startYmd"
            :program-end-date-ymd="programDateBounds.endYmd" @prev-day="shiftSelectedDay(-1)"
            @next-day="shiftSelectedDay(1)" @go-today="goToToday" />

        <p v-if="tripCards.length === 0" class="text-body1 text-grey-7">
            {{ t("programsControl.emptyDay") }}
        </p>

        <q-virtual-scroll v-else :items="tripCards" virtual-scroll-horizontal v-slot="{ item, index }"
            class="snap-x snap-mandatory">
            <AppControlPanelTripCard :key="String(item.trip.id)" :card="item" @open-depart="openDepartModal(item)"
                @arrive="confirmArrive(item)" @add-passenger="(name) => onAddPassenger(item, name)"
                @remove-passenger="(id) => removePassenger(id)" />
        </q-virtual-scroll>

        <AppControlPanelStartVoyageModal v-model:open="departModalOpen" :boat-options="boatOptions"
            :guide-options="guideOptions" :initial-boat-ids="departCard?.initialBoatIds ?? []"
            :initial-guide-ids="departCard?.initialGuideIds ?? []" :submitting="departSubmitting"
            @confirm="onConfirmDepart" />
    </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
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
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppControlPanelDayToolbar from "../components/control-panel/AppControlPanelDayToolbar.vue";
import AppControlPanelTripCard from "../components/control-panel/AppControlPanelTripCard.vue";
import AppControlPanelStartVoyageModal from "../components/control-panel/AppControlPanelStartVoyageModal.vue";
import type { ControlPanelSelectOption } from "../components/control-panel/AppControlPanelStartVoyageModal.vue";

const { t } = useI18n();
const route = useRoute();
const { confirm } = useConfirmDialog();
const powersync = getAppPowerSyncContext();

usePageLayout({ documentTitleKey: "programsControl.title" });

const programId = computed(() => String(route.params.programId ?? "").trim());

const {
    selectedDateYmd,
    tripCards,
    dayStats,
    tripDateYmds,
    programDateBounds,
    shiftSelectedDay,
    goToToday,
} = useControlPanelDayBoard(programId);

const { startDeparture, markArrival, addPassenger, removePassenger } =
    useControlPanelVoyageOps();

const boatsCollection = powersync.collections.boats;
const guidesCollection = powersync.collections.guides;

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

const departModalOpen = ref(false);
const departSubmitting = ref(false);
const departCard = ref<ControlPanelTripCardModel | null>(null);

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
</script>
