<template>
    <div class="relative snap-start shrink-0 h-full w-auto aspect-[5/12] overflow-hidden flex flex-col">
        <q-card-section class="shrink-0 mt-6">
            <div class="text-center">
                <div class="text-h6">{{ departureTimeLabel }}</div>
                <div class="text-subtitle1">{{ productTitle }}</div>
                <div class="text-body1">{{ passengerCount }}/{{ totalSeatsLabel }}</div>
                <div class="text-body2" :class="tripDisplayStatusTextClass">
                    {{ tripDisplayStatusLabel }}
                </div>
            </div>
        </q-card-section>

        <q-card-actions v-if="!manifestReadOnly" class="shrink-0 mx-22">
            <q-btn
                v-if="showDepart"
                class="col"
                color="primary"
                no-caps
                :label="t('programsControl.depart')"
                @click="emit('open-depart')"
            />
            <q-btn
                v-if="showArrive"
                class="col"
                color="secondary"
                no-caps
                :label="t('programsControl.arrive')"
                @click="emit('arrive')"
            />
        </q-card-actions>

        <div class="col relative-position min-h-0 mx-10 mt-8 mb-6">
            <q-scroll-area class="fit">
                <q-list separator>
                    <q-item v-for="item in manifestSlots" :key="item.key">
                        <q-item-section v-if="item.kind !== 'empty'">
                            <div class="row items-center no-wrap w-full">
                                <div class="col text-body1">{{ item.name }}</div>
                                <div v-if="canRemoveManifestItem(item)" class="col-auto">
                                    <q-btn
                                        flat
                                        dense
                                        round
                                        color="negative"
                                        icon="person_remove"
                                        :aria-label="removeManifestAriaLabel(item)"
                                        @click="onRemoveManifestItem(item)"
                                    />
                                </div>
                            </div>
                        </q-item-section>
                        <q-item-section
                            v-else
                            :class="{ 'cursor-pointer': canManageBookings || canManagePassengers }"
                            class="h-8 border-2 border-dashed border-black/24"
                            @click="onEmptySlotClick"
                        >
                            <div class="row items-center justify-center w-full">
                                <q-btn
                                    v-if="canManageBookings"
                                    flat
                                    round
                                    color="primary"
                                    icon="add"
                                    :aria-label="t('programsControl.addWalkIn')"
                                    @click.stop="emit('open-walk-in')"
                                />
                                <q-btn
                                    v-else-if="canManagePassengers"
                                    flat
                                    round
                                    color="primary"
                                    icon="add"
                                    :aria-label="t('programsControl.addPassenger')"
                                    @click.stop="openAddPassengerDialog"
                                />
                            </div>
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-scroll-area>
        </div>

        <q-dialog v-model="addPassengerDialogOpen" persistent>
            <q-card class="min-w-[280px]">
                <q-card-section class="text-h6">
                    {{ t('programsControl.addPassenger') }}
                </q-card-section>
                <q-form @submit="submitAddPassenger">
                    <q-card-section>
                        <q-input
                            v-model="newPassengerName"
                            :label="t('programsControl.passengerName')"
                            autofocus
                        />
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn v-close-popup flat no-caps :label="t('common.cancel')" />
                        <q-btn color="primary" no-caps type="submit" :label="t('common.save')" />
                    </q-card-actions>
                </q-form>
            </q-card>
        </q-dialog>

        <svg
            class="absolute inset-0 pointer-events-none"
            :class="tripBorderStrokeClass"
            viewBox="0 0 200 480"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M 100 12 C 55 35, 16 130, 16 250 C 16 350, 40 430, 60 455 C 70 462, 85 466, 100 466 C 115 466, 130 462, 140 455 C 160 430, 184 350, 184 250 C 184 130, 145 35, 100 12 Z"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
            />
        </svg>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useConfirmDialog } from '../../composables/useConfirmDialog';
import type { ControlPanelTripCardModel } from '../../composables/useControlPanelDayBoard';
import {
    resolveControlPanelTripDisplayStatus,
    type ControlPanelTripDisplayStatus,
} from '../../utilities/control-panel-day-board';

type ManifestPassengerSlot = {
    kind: 'passenger';
    key: string;
    name: string;
    passengerId: string;
};

type ManifestBookedSlot = {
    kind: 'booked';
    key: string;
    name: string;
    ticketId: string;
    bookingId: string;
};

type ManifestEmptySlot = {
    kind: 'empty';
    key: string;
};

type ManifestOccupiedSlot = ManifestPassengerSlot | ManifestBookedSlot;
type ManifestSlot = ManifestOccupiedSlot | ManifestEmptySlot;

const props = defineProps<{
    card: ControlPanelTripCardModel;
}>();

const emit = defineEmits<{
    'open-depart': [];
    arrive: [];
    'add-passenger': [name: string];
    'remove-passenger': [passengerId: string];
    'open-walk-in': [];
    'remove-booked-ticket': [ticketId: string, bookingId: string];
}>();

const { t, locale } = useI18n();
const $q = useQuasar();
const { confirm } = useConfirmDialog();

const addPassengerDialogOpen = ref(false);
const newPassengerName = ref('');

const productTitle = computed(() =>
    String(props.card.trip.product_name ?? props.card.trip.boatTypeName ?? '—'),
);

const departureTimeLabel = computed((): string => {
    const raw = props.card.trip.scheduled_departure_at;
    if (raw == null || String(raw).trim() === '') {
        return '—';
    }
    try {
        return new Intl.DateTimeFormat(String(locale.value), {
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(String(raw)));
    } catch {
        return String(raw);
    }
});

const passengerCount = computed((): number =>
    props.card.voyage != null ? props.card.passengers.length : props.card.bookedCount,
);

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

const tripDisplayStatusTextClass = computed((): string => {
    switch (tripDisplayStatus.value) {
        case 'on_water':
            return 'text-green-600';
        case 'returned':
        case 'cancelled':
            return 'text-grey-6';
        default:
            return 'text-blue-600';
    }
});

const tripBorderStrokeClass = computed((): string => {
    switch (tripDisplayStatus.value) {
        case 'on_water':
            return 'text-green-600';
        case 'returned':
        case 'cancelled':
            return 'text-grey-6';
        default:
            return 'text-blue-600';
    }
});

const manifestReadOnly = computed(
    () => voyageStatus.value === 'completed' || voyageStatus.value === 'cancelled',
);

const canManagePassengers = computed(
    () => props.card.voyage != null && !manifestReadOnly.value,
);

const canManageBookings = computed(() => props.card.voyage == null);

const manifestSlots = computed((): ManifestSlot[] =>
    buildManifestSlots(props.card, tripCapacity.value ?? 0),
);

const showDepart = computed(
    () =>
        props.card.voyage == null ||
        voyageStatus.value === 'draft' ||
        voyageStatus.value === 'ready',
);

const showArrive = computed(() => voyageStatus.value === 'underway');

function slotDisplayName(raw: unknown): string {
    const trimmed = String(raw ?? '').trim();
    return trimmed.length > 0 ? trimmed : '—';
}

function buildManifestSlots(card: ControlPanelTripCardModel, capacity: number): ManifestSlot[] {
    const slots: ManifestSlot[] = [];

    if (card.voyage != null) {
        for (const passenger of card.passengers) {
            slots.push({
                kind: 'passenger',
                key: `passenger-${passenger.id}`,
                name: slotDisplayName(passenger.name),
                passengerId: String(passenger.id),
            });
        }
    } else {
        for (const ticket of card.bookingTickets) {
            slots.push({
                kind: 'booked',
                key: `booked-${ticket.id}`,
                name: slotDisplayName(ticket.name),
                ticketId: String(ticket.id),
                bookingId: String(ticket.booking_id),
            });
        }
    }

    const emptyCount = capacity > 0 ? Math.max(0, capacity - slots.length) : 0;
    for (let index = 0; index < emptyCount; index += 1) {
        slots.push({ kind: 'empty', key: `empty-${index}` });
    }

    return slots;
}

function canRemoveManifestItem(item: ManifestOccupiedSlot): boolean {
    return (
        (item.kind === 'passenger' && canManagePassengers.value) ||
        (item.kind === 'booked' && canManageBookings.value)
    );
}

function removeManifestAriaLabel(item: ManifestOccupiedSlot): string {
    return item.kind === 'passenger'
        ? t('programsControl.removePassenger')
        : t('programsControl.removeWalkIn');
}

function openAddPassengerDialog(): void {
    newPassengerName.value = '';
    addPassengerDialogOpen.value = true;
}

function onEmptySlotClick(): void {
    if (canManageBookings.value) {
        emit('open-walk-in');
        return;
    }
    if (canManagePassengers.value) {
        openAddPassengerDialog();
    }
}

function submitAddPassenger(): void {
    const name = newPassengerName.value.trim();
    if (name.length === 0) {
        $q.notify({ type: 'negative', message: t('programsControl.passengerNameRequired') });
        return;
    }
    emit('add-passenger', name);
    newPassengerName.value = '';
    addPassengerDialogOpen.value = false;
}

function onRemoveManifestItem(item: ManifestOccupiedSlot): void {
    if (item.kind === 'passenger') {
        confirm({
            title: t('programsControl.removePassenger'),
            message: t('programsControl.removePassengerConfirm', { name: item.name }),
            onOk: () => emit('remove-passenger', item.passengerId),
        });
        return;
    }

    confirm({
        title: t('programsControl.removeWalkIn'),
        message: t('programsControl.removeWalkInConfirm', { name: item.name }),
        onOk: () => emit('remove-booked-ticket', item.ticketId, item.bookingId),
    });
}
</script>
