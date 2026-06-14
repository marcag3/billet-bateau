<template>
    <div>
        <q-btn
            no-caps
            outline
            :color="isActive ? 'secondary' : 'primary'"
            :class="{ 'text-weight-bold': isActive, 'bg-blue-1': isActive }"
            :label="triggerLabel"
            @click="dialogOpen = true"
        />

        <q-dialog
            v-model="dialogOpen"
            position="right"
            transition-show="slide-left"
            transition-hide="slide-right"
        >
            <q-card class="full-height" style="width: 100vw; max-width: 450px">
                <q-card-section class="row items-center q-pb-none">
                    <div class="col text-h6">{{ t('publicBooking.productFilterModalTitle') }}</div>
                    <q-btn v-close-popup flat round dense icon="close" :aria-label="t('common.dismiss')" />
                </q-card-section>

                <q-card-section v-if="productFilterOptions.length === 0" class="text-body2 text-grey-7">
                    {{ t('publicBooking.noProductFilters') }}
                </q-card-section>

                <q-card-section v-else>
                    <q-list separator bordered>
                        <q-item
                            v-for="opt in productFilterOptions"
                            :key="opt.id"
                            v-ripple
                            clickable
                            :active="selectedProductId === opt.id"
                            active-class="bg-blue-1"
                            @click="onPick(opt.id)"
                        >
                            <q-item-section>
                                <q-img
                                    v-if="hasBanner(opt)"
                                    height="20rem"
                                    :src="String(opt.bannerUrl)"
                                    :alt="opt.name"
                                    fit="cover"
                                    ratio="16/9"
                                >
                                    <div class="absolute-bottom">
                                        <p class="text-body1 q-mt-sm text-weight-medium">
                                            {{ opt.name }}
                                        </p>
                                        <p v-if="hasDescription(opt)" class="text-body2 q-mt-xs q-mb-none">
                                            {{ opt.description }}
                                        </p>
                                    </div>
                                </q-img>
                                <div
                                    v-else
                                    class="public-program-product-filter__placeholder rounded-borders flex flex-center"
                                >
                                    <div class="text-center q-pa-md">
                                        <q-icon name="image_not_supported" size="32px" color="grey-6" />
                                        <p class="text-body1 q-mt-sm text-weight-medium">
                                            {{ opt.name }}
                                        </p>
                                        <p v-if="hasDescription(opt)" class="text-body2 q-mt-xs q-mb-none text-grey-8">
                                            {{ opt.description }}
                                        </p>
                                    </div>
                                </div>
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
import type { PublicBookingProductFilterOption } from '../../models/public-booking/public-booking.types';

const props = defineProps<{
    productFilterOptions: PublicBookingProductFilterOption[];
}>();

const selectedProductId = defineModel<string>('selectedProductId', { required: true });

const { t } = useI18n();

const dialogOpen = ref(false);

const selectedOption = computed((): PublicBookingProductFilterOption | undefined => {
    const id = selectedProductId.value.trim();
    if (id.length === 0) {
        return undefined;
    }
    return props.productFilterOptions.find((o) => o.id === id);
});

const isActive = computed(() => selectedProductId.value.trim().length > 0);

const triggerLabel = computed((): string => {
    if (selectedOption.value != null) {
        return selectedOption.value.name;
    }
    return t('publicBooking.productFilterButton');
});

function hasBanner(opt: PublicBookingProductFilterOption): boolean {
    return opt.bannerUrl != null && String(opt.bannerUrl).trim().length > 0;
}

function hasDescription(opt: PublicBookingProductFilterOption): boolean {
    return opt.description != null && String(opt.description).trim().length > 0;
}

function onPick(id: string): void {
    selectedProductId.value = id;
    dialogOpen.value = false;
}
</script>

<style scoped>
.public-program-product-filter__placeholder {
    min-height: 20rem;
    aspect-ratio: 16 / 9;
    background: var(--q-blue-1);
}
</style>
