<template>
    <q-card class="control-panel-trip-card column">
        <q-img
            :src="bannerUrl"
            :ratio="16 / 9"
            class="control-panel-trip-card__hull"
        >
            <div class="absolute-top-left q-pa-sm">
                <q-badge color="primary" class="text-subtitle2">
                    {{ departureTimeLabel }}
                </q-badge>
            </div>
            <div class="absolute-top-right q-pa-sm">
                <q-badge :color="statusColor">{{ statusLabel }}</q-badge>
            </div>
            <div class="absolute-bottom">
                <div class="text-h6">{{ productTitle }}</div>
                <div v-if="routeSubtitle.length > 0" class="text-caption">
                    {{ routeSubtitle }}
                </div>
            </div>
        </q-img>

        <q-card-section class="col scroll" style="min-height: 120px">
            <div v-if="card.voyage == null && card.bookedTicketNames.length > 0" class="q-mb-sm">
                <div class="text-caption text-grey-7">
                    {{ t('programsControl.bookedPreview') }}
                </div>
                <div class="text-body2">{{ card.bookedTicketNames.join(', ') }}</div>
            </div>

            <div class="text-subtitle2 q-mb-xs">{{ t('programsControl.passengers') }}</div>
            <q-list v-if="card.passengers.length > 0" dense bordered separator>
                <AppControlPanelPassengerRow
                    v-for="pax in card.passengers"
                    :key="String(pax.id)"
                    :name="String(pax.name ?? '')"
                    :read-only="manifestReadOnly"
                    @remove="onRemovePassenger(String(pax.id), String(pax.name ?? ''))"
                />
            </q-list>
            <div v-else class="text-body2 text-grey-7 q-mb-sm">—</div>

            <q-btn
                v-if="!manifestReadOnly && card.voyage != null"
                flat
                dense
                no-caps
                color="primary"
                icon="person_add"
                :label="t('programsControl.addPassenger')"
                class="q-mt-sm"
                @click="addPassengerDialogOpen = true"
            />
        </q-card-section>

        <q-card-actions v-if="!manifestReadOnly" align="stretch" class="q-px-md q-pb-md">
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

        <q-dialog v-model="addPassengerDialogOpen" persistent>
            <q-card style="min-width: 280px">
                <q-card-section class="text-h6">
                    {{ t('programsControl.addPassenger') }}
                </q-card-section>
                <q-card-section>
                    <q-input
                        v-model="newPassengerName"
                        :label="t('programsControl.passengerName')"
                        autofocus
                        @keyup.enter="submitAddPassenger"
                    />
                </q-card-section>
                <q-card-actions align="right">
                    <q-btn v-close-popup flat no-caps :label="t('common.cancel')" />
                    <q-btn
                        color="primary"
                        no-caps
                        :label="t('common.save')"
                        @click="submitAddPassenger"
                    />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { ControlPanelTripCardModel } from '../../composables/useControlPanelDayBoard';
import { programBannerUrlFromObjectKey } from '../../utilities/program-banner-url';
import AppControlPanelPassengerRow from './AppControlPanelPassengerRow.vue';

const props = defineProps<{
    card: ControlPanelTripCardModel;
}>();

const emit = defineEmits<{
    'open-depart': [];
    arrive: [];
    'add-passenger': [name: string];
    'remove-passenger': [passengerId: string];
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

const voyageStatus = computed(() => String(props.card.voyage?.status ?? '').trim());

const manifestReadOnly = computed(
    () => voyageStatus.value === 'completed' || voyageStatus.value === 'cancelled',
);

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
</script>

<style scoped>
.control-panel-trip-card {
    min-width: min(50vw, 420px);
    max-width: min(50vw, 420px);
    height: min(78vh, 720px);
}

.control-panel-trip-card__hull {
    clip-path: polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%);
}
</style>
