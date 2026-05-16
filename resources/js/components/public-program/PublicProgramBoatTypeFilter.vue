<template>
    <div>
        <q-btn no-caps outline :color="isActive ? 'secondary' : 'primary'"
            :class="{ 'text-weight-bold': isActive, 'bg-blue-1': isActive }" :label="triggerLabel"
            @click="dialogOpen = true" />

        <q-dialog v-model="dialogOpen" position="right" transition-show="slide-left" transition-hide="slide-right">
            <q-card class="full-height" style="width: 100vw;  max-width: 450px;">
                <q-card-section class="row items-center q-pb-none">
                    <div class="col text-h6">{{ t('publicBooking.boatTypeFilterModalTitle') }}</div>
                    <q-btn v-close-popup flat round dense icon="close" :aria-label="t('common.dismiss')" />
                </q-card-section>

                <q-card-section v-if="boatTypeFilterOptions.length === 0" class="text-body2 text-grey-7">
                    {{ t('publicBooking.noBoatTypeFilters') }}
                </q-card-section>

                <q-card-section v-else>
                    <q-list separator bordered>
                        <q-item v-for="opt in boatTypeFilterOptions" :key="opt.id" v-ripple clickable
                            :active="selectedBoatTypeId === opt.id" active-class="bg-blue-1" @click="onPick(opt.id)">

                            <q-item-section>

                                <q-img height="20rem" :src="String(opt.bannerUrl)" :alt="opt.name" fit="cover"
                                    ratio="16/9">
                                    <div class="absolute-bottom">
                                        <p class="text-body1 q-mt-sm text-weight-medium">
                                            {{ opt.name }}
                                        </p>
                                    </div>
                                </q-img>
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
import type { PublicBookingBoatTypeFilterOption } from '../../models/public-booking/public-booking.types';

const props = defineProps<{
    boatTypeFilterOptions: PublicBookingBoatTypeFilterOption[];
}>();

const selectedBoatTypeId = defineModel<string>('selectedBoatTypeId', { required: true });

const { t } = useI18n();

const dialogOpen = ref(false);

const selectedOption = computed((): PublicBookingBoatTypeFilterOption | undefined => {
    const id = selectedBoatTypeId.value.trim();
    if (id.length === 0) {
        return undefined;
    }
    return props.boatTypeFilterOptions.find((o) => o.id === id);
});

const isActive = computed(() => selectedBoatTypeId.value.trim().length > 0);

const triggerLabel = computed((): string => {
    if (selectedOption.value != null) {
        return selectedOption.value.name;
    }
    return t('publicBooking.boatTypeFilterButton');
});

function onPick(id: string): void {
    selectedBoatTypeId.value = id;
    dialogOpen.value = false;
}
</script>

<style scoped>
.public-program-filter-dialog__side {
    width: min(440px, 100vw);
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
}


.public-program-filter-option__img--placeholder {
    min-height: 140px;
    background: var(--q-blue-1);
}

.public-program-filter-dialog__centered {
    width: min(400px, 100vw);
}
</style>
