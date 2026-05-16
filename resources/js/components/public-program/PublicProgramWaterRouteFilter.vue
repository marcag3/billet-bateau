<template>
    <div>
        <q-btn no-caps outline :color="isActive ? 'secondary' : 'primary'"
            :class="{ 'text-weight-bold': isActive, 'bg-blue-1': isActive }" :label="triggerLabel"
            @click="dialogOpen = true" />

        <q-dialog v-model="dialogOpen" position="right" transition-show="slide-left" transition-hide="slide-right">
            <q-card class="full-height" style="width: 100vw; max-width: 450px;">
                <q-card-section class="row items-center q-pb-none">
                    <div class="col text-h6">{{ t('publicBooking.waterRouteFilterModalTitle') }}</div>
                    <q-btn v-close-popup flat round dense icon="close" :aria-label="t('common.dismiss')" />
                </q-card-section>

                <q-card-section v-if="waterRouteFilterOptions.length === 0" class="text-body2 text-grey-7">
                    {{ t('publicBooking.noWaterRouteFilters') }}
                </q-card-section>

                <q-card-section v-else>
                    <q-list separator bordered>
                        <q-item v-for="opt in waterRouteFilterOptions" :key="opt.id" v-ripple clickable
                            :active="selectedWaterRouteId === opt.id" active-class="bg-blue-1" @click="onPick(opt.id)">
                            <q-item-section>
                                <AppWaterRouteTracePreview class="public-program-water-route-filter__trace"
                                    :trace-geo-json="opt.traceGeoJson" :title="opt.name" />
                                <q-item-label v-if="opt.durationMinutes !== null" caption class="text-grey-7 q-mt-sm">
                                    {{
                                        t('publicBooking.routeDurationMinutes', {
                                            minutes: String(opt.durationMinutes),
                                        })
                                    }}
                                </q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-card-section>
            </q-card>
        </q-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PublicBookingWaterRouteFilterOption } from '../../models/public-booking/public-booking.types';
import AppWaterRouteTracePreview from '../molecules/AppWaterRouteTracePreview.vue';

const props = defineProps<{
    waterRouteFilterOptions: PublicBookingWaterRouteFilterOption[];
}>();

const selectedWaterRouteId = defineModel<string>('selectedWaterRouteId', { required: true });

const { t } = useI18n();

const dialogOpen = ref(false);

const selectedOption = computed((): PublicBookingWaterRouteFilterOption | undefined => {
    const id = selectedWaterRouteId.value.trim();
    if (id.length === 0) {
        return undefined;
    }
    return props.waterRouteFilterOptions.find((o) => o.id === id);
});

const isActive = computed(() => selectedWaterRouteId.value.trim().length > 0);

const triggerLabel = computed((): string => {
    if (selectedOption.value != null) {
        return selectedOption.value.name;
    }
    return t('publicBooking.waterRouteFilterButton');
});

function hasBanner(opt: PublicBookingWaterRouteFilterOption | null | undefined): boolean {
    return opt != null && opt.bannerUrl != null && opt.bannerUrl.length > 0;
}

function onPick(id: string): void {
    selectedWaterRouteId.value = id;
    dialogOpen.value = false;
}
</script>

<style scoped>
.public-program-water-route-filter__trace :deep(.app-water-route-trace-preview__map) {
    aspect-ratio: 16 / 9;
    min-height: 20rem;
}
</style>
