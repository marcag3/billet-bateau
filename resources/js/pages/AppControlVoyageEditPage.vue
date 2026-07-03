<template>
    <AppEntityEditPageLayout
        :title="t('programsControlAdmin.editVoyageTitle')"
        :back-to="backTo"
        :back-label="t('programsControlAdmin.backToVoyages')"
    >
        <q-banner v-if="showNotFound" class="bg-warning text-dark mb-4" rounded>
            {{ t('programsControlAdmin.voyageNotFound') }}
            <template #action>
                <q-btn color="primary" flat :label="t('programsControlAdmin.backToVoyages')" :to="backTo" />
            </template>
        </q-banner>

        <AppControlVoyageEditForm
            v-else-if="voyageId.length > 0"
            :voyage-id="voyageId"
            @deleted="onVoyageDeleted"
            @open-booking="onOpenBooking"
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
import type { VoyageOutput } from '../powersync/voyages.collection';
import { controlContextNamedRoute } from '../utilities/control-context-route';
import AppEntityEditPageLayout from '../layouts/AppEntityEditPageLayout.vue';
import AppControlVoyageEditForm from '../components/control-panel/AppControlVoyageEditForm.vue';

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const voyageId = computed(() => String(route.params.voyageId ?? '').trim());

const backTo = computed(() => controlContextNamedRoute(route, 'control.voyages.list'));

const { data: voyageRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.voyages.value;
        const id = voyageId.value.trim();
        if (!col || id.length === 0) {
            return undefined;
        }
        return qb.from({ v: col }).where(({ v }) => eq(v.id, id));
    },
    [powersync.collections.voyages, voyageId],
);

const currentVoyage = computed(() => {
    const rows = liveQueryRows<VoyageOutput>(voyageRaw.value);
    return rows[0] ?? null;
});

const showNotFound = computed(
    () => voyageId.value.length > 0 && voyageRaw.value != null && currentVoyage.value == null,
);

async function onVoyageDeleted(): Promise<void> {
    await router.push(backTo.value);
}

async function onOpenBooking(bookingId: string): Promise<void> {
    await router.push(
        controlContextNamedRoute(route, 'control.bookings.edit', { bookingId }),
    );
}
</script>
