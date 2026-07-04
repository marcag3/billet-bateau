<template>
    <AppEntityEditPageLayout
        :title="t('programsControlAdmin.editBookingTitle')"
        :back-to="backTo"
        :back-label="t('programsControlAdmin.backToBookings')"
    >
        <q-banner v-if="showNotFound" class="bg-warning text-dark mb-4" rounded>
            {{ t('programsControlAdmin.bookingNotFound') }}
            <template #action>
                <q-btn color="primary" flat :label="t('programsControlAdmin.backToBookings')" :to="backTo" />
            </template>
        </q-banner>

        <AppControlBookingEditForm
            v-else-if="bookingId.length > 0"
            :booking-id="bookingId"
            @deleted="onBookingDeleted"
        />
    </AppEntityEditPageLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { liveQueryRows } from '../powersync/live-query-casts';
import type { BookingOutput } from '../powersync/bookings.collection';
import { controlContextNamedRoute } from '../utilities/control-context-route';
import AppEntityEditPageLayout from '../layouts/AppEntityEditPageLayout.vue';
import AppControlBookingEditForm from '../components/control-panel/AppControlBookingEditForm.vue';

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const bookingId = computed(() => String(route.params.bookingId ?? '').trim());

const backTo = computed(() => controlContextNamedRoute(route, 'control.bookings.list'));

const { data: bookingRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.bookings.value;
        const id = bookingId.value.trim();
        if (!col || id.length === 0) {
            return undefined;
        }
        return qb.from({ b: col }).where(({ b }) => eq(b.id, id));
    },
    [powersync.collections.bookings, bookingId],
);

const currentBooking = computed(() => {
    const rows = liveQueryRows<BookingOutput>(bookingRaw.value);
    return rows[0] ?? null;
});

const showNotFound = computed(
    () => bookingId.value.length > 0 && bookingRaw.value != null && currentBooking.value == null,
);

async function onBookingDeleted(): Promise<void> {
    await router.push(backTo.value);
}
</script>
