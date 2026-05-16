<template>
    <div>
        <q-btn no-caps outline :color="isActive ? 'secondary' : 'primary'"
            :class="{ 'text-weight-bold': isActive, 'bg-blue-1': isActive }" :label="triggerLabel"
            @click="dialogOpen = true" icon="event" :disable="!hasSelectableDates" />

        <q-dialog v-model="dialogOpen" :position="isDesktopSidePanel ? 'right' : 'standard'"
            transition-show="slide-left" transition-hide="slide-right">
            <q-card class="column no-wrap" :class="{
                'public-program-filter-dialog__side': isDesktopSidePanel,
                'public-program-filter-dialog__centered': !isDesktopSidePanel,
            }">
                <q-card-section class="row items-center q-pb-none">
                    <div class="col text-h6">{{ t('publicBooking.dateFilterModalTitle') }}</div>
                    <q-btn v-close-popup flat round dense icon="close" :aria-label="t('common.dismiss')" />
                </q-card-section>

                <q-card-section v-if="!hasSelectableDates" class="text-body2 text-grey-7">
                    {{ t('publicBooking.noDatesWithTrips') }}
                </q-card-section>

                <q-card-section v-else class="col scroll q-pt-sm">
                    <q-date v-model="qDateModel" mask="YYYY-MM-DD" :default-year-month="defaultYearMonth"
                        :events="hasAvailabilityEvent" :event-color="availabilityEventColor" :options="isDaySelectable"
                        :navigation-min-year-month="navigationMinYearMonth"
                        :navigation-max-year-month="navigationMaxYearMonth" @update:model-value="onDatePicked" />

                    <div class="row q-gutter-md text-caption text-grey-8 q-mt-md">
                        <div class="row items-center q-gutter-xs">
                            <span class="public-booking-date-filter__dot public-booking-date-filter__dot--red" />
                            <span>{{ t('publicBooking.availabilityLegendFull') }}</span>
                        </div>
                        <div class="row items-center q-gutter-xs">
                            <span class="public-booking-date-filter__dot public-booking-date-filter__dot--yellow" />
                            <span>{{ t('publicBooking.availabilityLegendLow') }}</span>
                        </div>
                        <div class="row items-center q-gutter-xs">
                            <span class="public-booking-date-filter__dot public-booking-date-filter__dot--green" />
                            <span>{{ t('publicBooking.availabilityLegendGood') }}</span>
                        </div>
                    </div>
                </q-card-section>

                <q-card-actions v-if="hasSelectableDates" align="stretch" class="q-px-md q-pb-md">
                    <q-btn class="col" outline no-caps color="grey-7" :label="t('publicBooking.clearDateFilter')"
                        :disable="selectedDateYmd.trim().length === 0" @click="clearDate" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { PublicBookingDailyAvailability } from '../../utilities/public-booking-filters';
import {
    isPublicBookingDayHashSelectable,
    qDateDayHashToIsoYmd,
} from '../../utilities/public-booking-filters';

const props = defineProps<{
    dailyAvailabilityByDate: Record<string, PublicBookingDailyAvailability>;
}>();

const selectedDateYmd = defineModel<string>('selectedDateYmd', { required: true });

const { t, locale } = useI18n();
const $q = useQuasar();

const dialogOpen = ref(false);

const isDesktopSidePanel = computed(() => $q.screen.gt.sm);

const sortedAvailabilityYmd = computed((): string[] => Object.keys(props.dailyAvailabilityByDate).sort());

const hasSelectableDates = computed(() => sortedAvailabilityYmd.value.length > 0);

const isActive = computed(() => selectedDateYmd.value.trim().length > 0);

const triggerLabel = computed((): string => {
    if (selectedDateYmd.value.trim().length === 0) {
        return t('publicBooking.dateFilterButton');
    }
    try {
        const parsed = new Date(`${selectedDateYmd.value}T00:00:00`);
        return new Intl.DateTimeFormat(String(locale.value), { dateStyle: 'medium' }).format(parsed);
    } catch {
        return selectedDateYmd.value;
    }
});

const qDateModel = computed<string | null>({
    get(): string | null {
        return selectedDateYmd.value.trim() === '' ? null : selectedDateYmd.value.trim();
    },
    set(value: string | null): void {
        selectedDateYmd.value = value?.trim() ?? '';
    },
});

function ymdToYearMonth(ymd: string): string | null {
    const trimmed = ymd.trim();
    if (trimmed.length < 7) {
        return null;
    }
    const y = trimmed.slice(0, 4);
    const m = trimmed.slice(5, 7);
    if (!/^\d{4}$/.test(y) || !/^\d{2}$/.test(m)) {
        return null;
    }
    return `${y}/${m}`;
}

const defaultYearMonth = computed((): string => {
    const fromSelected = ymdToYearMonth(selectedDateYmd.value);
    if (fromSelected != null) {
        return fromSelected;
    }
    const first = sortedAvailabilityYmd.value[0];
    const fromFirst = first != null ? ymdToYearMonth(first) : null;
    if (fromFirst != null) {
        return fromFirst;
    }
    const now = new Date();
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
});

const navigationMinYearMonth = computed((): string | undefined => {
    const first = sortedAvailabilityYmd.value[0];
    return first != null ? ymdToYearMonth(first) ?? undefined : undefined;
});

const navigationMaxYearMonth = computed((): string | undefined => {
    const last = sortedAvailabilityYmd.value.at(-1);
    return last != null ? ymdToYearMonth(last) ?? undefined : undefined;
});

function isDaySelectable(dayHash: string): boolean {
    return isPublicBookingDayHashSelectable(dayHash, props.dailyAvailabilityByDate);
}

function hasAvailabilityEvent(dayHash: string): boolean {
    const ymd = qDateDayHashToIsoYmd(dayHash);
    return props.dailyAvailabilityByDate[ymd] !== undefined;
}

function availabilityEventColor(dayHash: string): string {
    const ymd = qDateDayHashToIsoYmd(dayHash);
    const dot = props.dailyAvailabilityByDate[ymd]?.dotColor;
    if (dot === 'red') {
        return 'negative';
    }
    if (dot === 'yellow') {
        return 'warning';
    }
    if (dot === 'green') {
        return 'positive';
    }
    return 'grey';
}

function onDatePicked(value: string | null): void {
    if (value != null && String(value).trim().length > 0) {
        dialogOpen.value = false;
    }
}

function clearDate(): void {
    selectedDateYmd.value = '';
}
</script>

<style scoped>
.public-program-filter-dialog__side {
    width: min(440px, 100vw);
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
}

.public-program-filter-dialog__centered {
    width: min(420px, 100vw);
}

.public-booking-date-filter__dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    display: inline-flex;
}

.public-booking-date-filter__dot--red {
    background: #d32f2f;
}

.public-booking-date-filter__dot--yellow {
    background: #f9a825;
}

.public-booking-date-filter__dot--green {
    background: #2e7d32;
}
</style>
