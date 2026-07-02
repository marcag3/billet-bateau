<template>
    <div class="relative snap-start shrink-0 overflow-hidden flex flex-col"
        :style="tripCardSizeStyle">
        <div class="shrink-0 mt-10 w-full min-w-0 px-14">
            <div class="text-center min-w-0">
                <div class="text-h6">{{ departureTimeLabel }}</div>
                <div class="text-h6">{{ passengerCount }}/{{ totalSeatsLabel }}</div>
                <div class="text-h6" :style="tripDisplayStatusStyle">
                    {{ tripDisplayStatusLabel }}
                </div>
                <div class="text-body2 ellipsis block max-w-full mx-auto" :title="productTitle">
                    {{ productTitle }}
                </div>
            </div>
        </div>

        <q-card-actions v-if="!manifestReadOnly" class="shrink-0 mx-22">
            <q-btn v-if="showDepart" class="col" color="primary" no-caps :label="t('programsControl.depart')"
                @click="emit('open-depart')" />
            <q-btn v-if="showArrive" class="col" color="secondary" no-caps :label="t('programsControl.arrive')"
                @click="emit('arrive')" />
        </q-card-actions>

        <div class="col relative-position min-h-0 mx-10  mb-16">
            <q-scroll-area class="fit">
                <q-list separator>
                    <q-item v-for="item in manifestSlots" :key="item.key">
                        <q-item-section v-if="item.kind !== 'empty'">
                            <div class="row items-center no-wrap w-full ">
                                <q-icon v-if="item.kind === 'passenger'" name="check" color="positive" size="xs" />
                                <div class="col text-body1">{{ item.name }}</div>
                                <div v-if="manifestItemCanCheckIn(item)" class="col-auto">
                                    <q-btn flat dense round color="primary" icon="how_to_reg" size="sm"
                                        :aria-label="t('programsControl.checkIn')"
                                        @click="emit('check-in-booking', item.bookingId)" />
                                </div>
                                <div v-if="canRemoveManifestItem(item)" class="col-auto">
                                    <q-btn flat dense round color="negative" icon="person_remove" size="sm"
                                        :aria-label="removeManifestAriaLabel(item)"
                                        @click="onRemoveManifestItem(item)" />
                                </div>
                            </div>
                        </q-item-section>
                        <q-item-section v-else :class="{ 'cursor-pointer': canAddWalkIn }"
                            class="h-8 border-2 border-dashed border-black/24" @click="onEmptySlotClick">
                            <div class="row items-center justify-center w-full">
                                <q-btn v-if="canAddWalkIn" flat round color="primary" icon="add" size="sm"
                                    :aria-label="t('programsControl.addWalkIn')" @click.stop="emit('open-walk-in')" />
                            </div>
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-scroll-area>
        </div>

        <div v-if="showDepartedAssignment || showCancel" class="shrink-0 mx-10 mb-8 text-center min-w-0">
            <template v-if="showDepartedAssignment">
                <div class="text-body2 ellipsis block max-w-full" :title="departedGuideLabel">
                    {{ departedGuideLabel }}
                </div>
                <div class="text-body2 ellipsis block max-w-full" :title="departedBoatLabel">
                    {{ departedBoatLabel }}
                </div>
            </template>
            <q-btn v-if="showCancel" flat dense no-caps size="sm" color="negative"
                :label="t('programsControl.cancelTrip')" @click="emit('cancel')" />
        </div>

        <svg class="absolute inset-0 pointer-events-none" :style="tripDisplayStatusStyle" viewBox="0 0 200 480"
            xmlns="http://www.w3.org/2000/svg">
            <path
                d="M 100 12 C 55 35, 16 130, 16 250 C 16 350, 40 430, 60 455 C 70 462, 85 466, 100 466 C 115 466, 130 462, 140 455 C 160 430, 184 350, 184 250 C 184 130, 145 35, 100 12 Z"
                fill="none" stroke="currentColor" stroke-width="3" />
        </svg>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useConfirmDialog } from '../../composables/useConfirmDialog';
import type { ControlPanelTripCardModel } from '../../composables/useControlPanelDayBoard';
import {
    buildManifestSlots,
    isControlPanelManifestModifiable,
    type ManifestOccupiedSlot,
    type ManifestSlot,
} from '../../utilities/control-panel-manifest';
import {
    controlPanelTripDisplayStatusColor,
    hasControlPanelTripDeparted,
    resolveControlPanelDepartedAssignmentLabels,
    resolveControlPanelTripDisplayStatus,
    type ControlPanelTripDisplayStatus,
} from '../../utilities/control-panel-day-board';
import { formatIsoInTimezone } from '../../utilities/program-timezone-datetime';
import {
    CONTROL_PANEL_TRIP_CARD_HEIGHT_PX,
    CONTROL_PANEL_TRIP_CARD_WIDTH_PX,
} from '../../utilities/control-panel-trip-card-layout';

const tripCardSizeStyle = {
    height: `${CONTROL_PANEL_TRIP_CARD_HEIGHT_PX}px`,
    width: `${CONTROL_PANEL_TRIP_CARD_WIDTH_PX}px`,
};

const props = defineProps<{
    card: ControlPanelTripCardModel;
    programTimezone: string;
    boatNamesById?: Readonly<Record<string, string>>;
    guideNamesById?: Readonly<Record<string, string>>;
}>();

const emit = defineEmits<{
    'open-depart': [];
    arrive: [];
    cancel: [];
    'open-walk-in': [];
    'remove-booked-ticket': [ticketId: string, bookingId: string];
    'undo-check-in-booking': [bookingId: string];
    'remove-passenger': [passengerId: string];
    'check-in-booking': [bookingId: string];
}>();
const { t, locale } = useI18n();
const { confirm } = useConfirmDialog();

const productTitle = computed(() =>
    String(props.card.trip.product_name ?? props.card.trip.boatTypeName ?? '—'),
);

const departureTimeLabel = computed((): string => {
    const raw = props.card.trip.scheduled_departure_at;
    if (raw == null || String(raw).trim() === '') {
        return '—';
    }
    try {
        return formatIsoInTimezone(String(raw), props.programTimezone, String(locale.value), {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return String(raw);
    }
});

const passengerCount = computed((): number => {
    if (props.card.voyage == null) {
        return props.card.bookedCount;
    }

    if (!manifestModifiable.value) {
        return props.card.passengers.length;
    }

    return (
        props.card.passengers.length +
        props.card.pendingBookingGroups.reduce(
            (sum, group) => sum + group.ticketCount,
            0,
        )
    );
});

const tripCapacity = computed((): number | null => {
    const cap = props.card.trip.capacity;
    if (cap == null || !Number.isFinite(Number(cap))) {
        return null;
    }
    return Math.max(0, Math.floor(Number(cap)));
});

const totalSeatsLabel = computed((): string =>
    tripCapacity.value == null ? '—' : String(tripCapacity.value),
);

const voyageStatus = computed(() => String(props.card.voyage?.status ?? '').trim());

const tripDisplayStatus = computed((): ControlPanelTripDisplayStatus =>
    resolveControlPanelTripDisplayStatus(props.card.voyage),
);

const tripDisplayStatusLabel = computed((): string => {
    switch (tripDisplayStatus.value) {
        case 'boarding':
            return t('programsControl.tripStatusBoarding');
        case 'on_water':
            return t('programsControl.tripStatusOnWater');
        case 'returned':
            return t('programsControl.tripStatusReturned');
        case 'cancelled':
            return t('programsControl.statusCancelled');
        default:
            return t('programsControl.tripStatusScheduled');
    }
});

const tripDisplayStatusStyle = computed((): { color: string } => ({
    color: controlPanelTripDisplayStatusColor(tripDisplayStatus.value),
}));

const manifestReadOnly = computed(
    () => voyageStatus.value === 'completed' || voyageStatus.value === 'cancelled',
);

const manifestModifiable = computed(() =>
    isControlPanelManifestModifiable(props.card.voyage),
);

const canAddWalkIn = computed(() => manifestModifiable.value);

const manifestSlots = computed((): ManifestSlot[] =>
    buildManifestSlots(props.card, tripCapacity.value ?? 0, manifestModifiable.value),
);

const showDepart = computed(() => tripDisplayStatus.value === 'boarding');

const showArrive = computed(() => voyageStatus.value === 'underway');

const showCancel = computed(() => manifestModifiable.value);

const showDepartedAssignment = computed(() =>
    hasControlPanelTripDeparted(props.card.voyage),
);

const departedAssignmentLabels = computed(() =>
    resolveControlPanelDepartedAssignmentLabels(
        props.card.initialBoatIds,
        props.card.initialGuideIds,
        props.boatNamesById ?? {},
        props.guideNamesById ?? {},
    ),
);

const departedGuideLabel = computed(() => departedAssignmentLabels.value.guideLabel);

const departedBoatLabel = computed(() => departedAssignmentLabels.value.boatLabel);

function manifestItemCanCheckIn(item: ManifestOccupiedSlot): boolean {
    return (
        manifestModifiable.value &&
        (item.kind === 'pendingBooking' || item.kind === 'booked') &&
        item.canCheckIn
    );
}

function canRemoveManifestItem(item: ManifestOccupiedSlot): boolean {
    if (!manifestModifiable.value) {
        return false;
    }
    return (
        item.kind === 'booked' ||
        item.kind === 'pendingBooking' ||
        item.kind === 'passenger'
    );
}

function removeManifestAriaLabel(item: ManifestOccupiedSlot): string {
    if (item.kind === 'passenger') {
        return t('programsControl.removePassenger');
    }
    return t('programsControl.removeWalkIn');
}

function onEmptySlotClick(): void {
    if (canAddWalkIn.value) {
        emit('open-walk-in');
    }
}

function onRemoveManifestItem(item: ManifestOccupiedSlot): void {
    if (item.kind === 'booked') {
        confirm({
            title: t('programsControl.removeWalkIn'),
            message: t('programsControl.removeWalkInConfirm', { name: item.name }),
            onOk: () => emit('remove-booked-ticket', item.ticketId, item.bookingId),
        });
        return;
    }

    if (item.kind === 'pendingBooking') {
        const group = props.card.pendingBookingGroups.find(
            (g) => g.bookingId === item.bookingId,
        );
        const firstTicket = group?.tickets[0];
        if (firstTicket == null) {
            return;
        }
        confirm({
            title: t('programsControl.removeWalkIn'),
            message: t('programsControl.removeWalkInConfirm', { name: item.name }),
            onOk: () =>
                emit('remove-booked-ticket', firstTicket.id, item.bookingId),
        });
        return;
    }

    if (item.kind === 'passenger') {
        if (item.bookingId != null) {
            confirm({
                title: t('programsControl.undoCheckIn'),
                message: t('programsControl.undoCheckInConfirm', { name: item.name }),
                onOk: () => emit('undo-check-in-booking', item.bookingId),
            });
            return;
        }

        confirm({
            title: t('programsControl.removePassenger'),
            message: t('programsControl.removePassengerConfirm', { name: item.name }),
            onOk: () => emit('remove-passenger', item.passengerId),
        });
    }
}
</script>
