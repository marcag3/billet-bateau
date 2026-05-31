<template>
    <div
        class="control-panel-trip-card relative snap-start shrink-0 h-full w-auto aspect-[5/12] overflow-hidden flex flex-col"
    >
        <q-card-section class="shrink-0 mt-12">
            <div class=" text-center">
                <div class="text-h6">{{ departureTimeLabel }}</div>
                <div class="text-subtitle1">{{ productTitle }}</div>
                <div class="text-body1">{{ passengerCount }}/{{ totalSeatsLabel }}</div>
            </div>
        </q-card-section>

        <q-card-actions v-if="!manifestReadOnly" class="shrink-0 mx-22">
            <q-btn v-if="showDepart" class="col" color="primary" no-caps :label="t('programsControl.depart')"
                @click="emit('open-depart')" />
            <q-btn v-if="showArrive" class="col" color="secondary" no-caps :label="t('programsControl.arrive')"
                @click="emit('arrive')" />
        </q-card-actions>
        <div class="col relative-position min-h-0 mx-10 mt-8 mb-6">
            <q-scroll-area class="fit">
                    <q-list separator class="">
                        <q-item v-for="item in manifestSlots" :key="item.key">
                            <q-item-section v-if="item.kind === 'passenger' || item.kind === 'booked'">
                                <div class="row items-center no-wrap w-full">
                                    <div class="col text-body1">{{ item.name }}</div>
                                    <div v-if="item.kind === 'passenger' && canManagePassengers" class="col-auto">
                                        <q-btn flat dense round color="negative" icon="person_remove"
                                            :aria-label="t('programsControl.removePassenger')"
                                            @click="onRemovePassenger(item.passengerId, item.name)" />
                                    </div>
                                    <div v-else-if="item.kind === 'booked' && canManageBookings" class="col-auto">
                                        <q-btn flat dense round color="negative" icon="person_remove"
                                            :aria-label="t('programsControl.removeWalkIn')"
                                            @click="onRemoveBookedTicket(item.ticketId, item.bookingId, item.name)" />
                                    </div>
                                </div>
                            </q-item-section>
                            <q-item-section v-else :class="{ 'cursor-pointer': canAddWalkIn || canManagePassengers }"
                                class="h-8 border-2 border-dashed border-black/24" @click="onEmptySlotClick">
                                <div class="row items-center justify-center w-full">
                                    <q-btn v-if="canAddWalkIn" flat round color="primary" icon="add"
                                        :aria-label="t('programsControl.addWalkIn')" @click.stop="openWalkInDialog" />
                                    <q-btn v-else-if="canManagePassengers" flat round color="primary" icon="add"
                                        :aria-label="t('programsControl.addPassenger')"
                                        @click.stop="openAddPassengerDialog" />
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
                <q-card-section>
                    <q-input v-model="newPassengerName" :label="t('programsControl.passengerName')" autofocus
                        @keyup.enter="submitAddPassenger" />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn v-close-popup flat no-caps :label="t('common.cancel')" />
                    <q-btn color="primary" no-caps :label="t('common.save')" @click="submitAddPassenger" />
                </q-card-actions>
            </q-card>
        </q-dialog>
        <svg class="absolute inset-0 pointer-events-none" viewBox="0 0 200 480" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M 100 12 C 55 35, 16 130, 16 250 C 16 350, 40 430, 60 455 C 70 462, 85 466, 100 466 C 115 466, 130 462, 140 455 C 160 430, 184 350, 184 250 C 184 130, 145 35, 100 12 Z"
                fill="none" stroke="#2563eb" stroke-width="3" />
        </svg>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { ControlPanelTripCardModel } from '../../composables/useControlPanelDayBoard';
import { programBannerUrlFromObjectKey } from '../../utilities/program-banner-url';

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

type ManifestSlot = ManifestPassengerSlot | ManifestBookedSlot | ManifestEmptySlot;

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

const addPassengerDialogOpen = ref(false);
const newPassengerName = ref('');

const bannerUrl = computed(() =>
    programBannerUrlFromObjectKey(props.card.trip.productBannerObjectKey),
);

const productTitle = computed(() =>
    String(props.card.trip.product_name ?? props.card.trip.boatTypeName ?? '—'),
);

const routeSubtitle = computed((): string => {
    const parts: string[] = [];
    const route = props.card.trip.waterRouteName;
    if (route != null && String(route).trim().length > 0) {
        parts.push(String(route));
    }
    const mins = props.card.trip.waterRouteDurationMinutes;
    if (mins != null && Number(mins) > 0) {
        parts.push(`${mins} min`);
    }
    return parts.join(' · ');
});

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

const passengerCount = computed((): number => {
    if (props.card.voyage != null) {
        return props.card.passengers.length;
    }
    return props.card.bookedCount;
});

const totalSeatsLabel = computed((): string => {
    const cap = props.card.trip.capacity;
    if (cap == null || !Number.isFinite(Number(cap))) {
        return '—';
    }
    return String(Number(cap));
});

const voyageStatus = computed(() => String(props.card.voyage?.status ?? '').trim());

const manifestReadOnly = computed(
    () => voyageStatus.value === 'completed' || voyageStatus.value === 'cancelled',
);

const canManagePassengers = computed(
    () => props.card.voyage != null && !manifestReadOnly.value,
);

const canManageBookings = computed(() => props.card.voyage == null);

const canAddWalkIn = computed(() => canManageBookings.value);

const canManageManifest = computed(
    () => canManagePassengers.value || canManageBookings.value,
);

const manifestSlots = computed((): ManifestSlot[] => {
    const slots: ManifestSlot[] = [];
    const cap = props.card.trip.capacity;
    const capacity =
        cap != null && Number.isFinite(Number(cap))
            ? Math.max(0, Math.floor(Number(cap)))
            : 0;

    if (props.card.voyage != null) {
        for (const passenger of props.card.passengers) {
            slots.push({
                kind: 'passenger',
                key: `passenger-${passenger.id}`,
                name: String(passenger.name ?? '').trim() || '—',
                passengerId: String(passenger.id),
            });
        }
    } else {
        for (const ticket of props.card.bookingTickets) {
            slots.push({
                kind: 'booked',
                key: `booked-${ticket.id}`,
                name: String(ticket.name ?? '').trim() || '—',
                ticketId: String(ticket.id),
                bookingId: String(ticket.booking_id),
            });
        }
    }

    const emptyCount = capacity > 0 ? Math.max(0, capacity - slots.length) : 0;
    for (let index = 0; index < emptyCount; index += 1) {
        slots.push({
            kind: 'empty',
            key: `empty-${index}`,
        });
    }

    return slots;
});

const showDepart = computed(
    () =>
        props.card.voyage == null ||
        voyageStatus.value === 'draft' ||
        voyageStatus.value === 'ready',
);

const showArrive = computed(() => voyageStatus.value === 'underway');

const statusLabel = computed((): string => {
    const s = voyageStatus.value;
    if (s === 'underway') {
        return t('programsControl.statusUnderway');
    }
    if (s === 'completed') {
        return t('programsControl.statusCompleted');
    }
    if (s === 'ready') {
        return t('programsControl.statusReady');
    }
    if (s === 'cancelled') {
        return t('programsControl.statusCancelled');
    }
    if (props.card.voyage != null) {
        return t('programsControl.statusDraft');
    }
    return t('programsControl.statusReady');
});

const statusColor = computed((): string => {
    const s = voyageStatus.value;
    if (s === 'underway') {
        return 'orange';
    }
    if (s === 'completed') {
        return 'positive';
    }
    if (s === 'cancelled') {
        return 'grey';
    }
    return 'primary';
});

function openAddPassengerDialog(): void {
    if (!canManagePassengers.value) {
        return;
    }
    newPassengerName.value = '';
    addPassengerDialogOpen.value = true;
}

function openWalkInDialog(): void {
    if (!canAddWalkIn.value) {
        return;
    }
    emit('open-walk-in');
}

function onEmptySlotClick(): void {
    if (canAddWalkIn.value) {
        openWalkInDialog();
        return;
    }
    openAddPassengerDialog();
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

function onRemovePassenger(passengerId: string, name: string): void {
    $q.dialog({
        title: t('programsControl.removePassenger'),
        message: t('programsControl.removePassengerConfirm', { name }),
        cancel: true,
    }).onOk(() => {
        emit('remove-passenger', passengerId);
    });
}

function onRemoveBookedTicket(ticketId: string, bookingId: string, name: string): void {
    $q.dialog({
        title: t('programsControl.removeWalkIn'),
        message: t('programsControl.removeWalkInConfirm', { name }),
        cancel: true,
    }).onOk(() => {
        emit('remove-booked-ticket', ticketId, bookingId);
    });
}
</script>