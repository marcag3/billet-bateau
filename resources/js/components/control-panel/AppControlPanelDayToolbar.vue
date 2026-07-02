<template>
    <div class="row items-center gap-2 mb-4 flex-wrap">
        <div class="col-auto row items-center gap-1">
            <q-btn
                flat
                round
                dense
                icon="chevron_left"
                :aria-label="t('programsControl.prevDay')"
                @click="emit('prev-day')"
            />
            <q-btn
                flat
                dense
                no-caps
                :label="t('programsControl.today')"
                @click="emit('go-today')"
            />
            <q-btn
                flat
                round
                dense
                icon="chevron_right"
                :aria-label="t('programsControl.nextDay')"
                @click="emit('next-day')"
            />
        </div>

        <div class="col-auto">
            <q-btn outline no-caps icon="event" :label="dateLabel" @click="dateDialogOpen = true" />
            <q-dialog v-model="dateDialogOpen">
                <q-card>
                    <q-card-section>
                        <q-date
                            v-model="qDateModel"
                            mask="YYYY-MM-DD"
                            :default-year-month="defaultYearMonth"
                            :events="hasTripOnDay"
                            event-color="primary"
                            :options="isDaySelectable"
                            :navigation-min-year-month="navigationMinYearMonth"
                            :navigation-max-year-month="navigationMaxYearMonth"
                            @update:model-value="onDatePicked"
                        />
                    </q-card-section>
                </q-card>
            </q-dialog>
        </div>

        <div class="col-auto">
            <q-toggle
                v-model="showFinishedTrips"
                dense
                :label="t('programsControl.showFinishedTrips')"
            />
        </div>

        <q-space />

        <div class="col-12 sm:col-auto row gap-2 flex-nowrap overflow-x-auto pb-1">
            <q-chip outline :style="controlPanelStatChipStyle('booked')">
                {{ t('programsControl.statsBooked') }}: {{ stats.booked }}
            </q-chip>
            <q-chip outline :style="controlPanelStatChipStyle('onWater')">
                {{ t('programsControl.statsOnWater') }}: {{ stats.onWater }}
            </q-chip>
            <q-chip outline :style="controlPanelStatChipStyle('returned')">
                {{ t('programsControl.statsReturned') }}: {{ stats.returned }}
            </q-chip>
            <q-chip outline :style="controlPanelStatChipStyle('totalPassengers')">
                {{ t('programsControl.statsTotalPassengers') }}: {{ stats.totalPassengers }}
            </q-chip>
            <q-chip outline :style="controlPanelStatChipStyle('places')">
                {{ t('programsControl.statsPlaces') }}: {{ stats.places }}
            </q-chip>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
    controlPanelStatChipStyle,
    normalizeCalendarYmd,
    type ControlPanelDayStats,
} from '../../utilities/control-panel-day-board';
import { qDateDayHashToIsoYmd } from '../../utilities/public-booking-filters';

const props = defineProps<{
    stats: ControlPanelDayStats;
    tripDateYmds: readonly string[];
    programStartDateYmd?: string;
    programEndDateYmd?: string;
}>();

const selectedDateYmd = defineModel<string>('selectedDateYmd', { required: true });
const showFinishedTrips = defineModel<boolean>('showFinishedTrips', { default: false });

const emit = defineEmits<{
    'prev-day': [];
    'next-day': [];
    'go-today': [];
}>();

const { t, locale } = useI18n();
const dateDialogOpen = ref(false);

const tripDateYmdSet = computed(() => new Set(props.tripDateYmds));

const dateLabel = computed((): string => {
    const ymd = selectedDateYmd.value.trim();
    if (ymd.length === 0) {
        return t('programsControl.today');
    }
    try {
        const parsed = new Date(`${ymd}T00:00:00`);
        return new Intl.DateTimeFormat(String(locale.value), { dateStyle: 'full' }).format(
            parsed,
        );
    } catch {
        return ymd;
    }
});

const qDateModel = computed<string | null>({
    get(): string | null {
        return selectedDateYmd.value.trim() === '' ? null : selectedDateYmd.value.trim();
    },
    set(value: string | null): void {
        const ymd = normalizeCalendarYmd(value);
        if (ymd == null) {
            return;
        }
        selectedDateYmd.value = ymd;
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

const programStartYmd = computed(() => String(props.programStartDateYmd ?? '').trim());
const programEndYmd = computed(() => String(props.programEndDateYmd ?? '').trim());

const defaultYearMonth = computed((): string => {
    const fromSelected = ymdToYearMonth(selectedDateYmd.value);
    if (fromSelected != null) {
        return fromSelected;
    }
    const first = props.tripDateYmds[0];
    const fromFirst = first != null ? ymdToYearMonth(first) : null;
    if (fromFirst != null) {
        return fromFirst;
    }
    const ps = programStartYmd.value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(ps)) {
        return ymdToYearMonth(ps) ?? `${ps.slice(0, 4)}/${ps.slice(5, 7)}`;
    }
    const now = new Date();
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
});

const navigationMinYearMonth = computed((): string | undefined => {
    const fromProgram = programStartYmd.value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromProgram)) {
        return ymdToYearMonth(fromProgram) ?? undefined;
    }
    const first = props.tripDateYmds[0];
    return first != null ? ymdToYearMonth(first) ?? undefined : undefined;
});

const navigationMaxYearMonth = computed((): string | undefined => {
    const fromProgram = programEndYmd.value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(fromProgram)) {
        return ymdToYearMonth(fromProgram) ?? undefined;
    }
    const last = props.tripDateYmds.at(-1);
    return last != null ? ymdToYearMonth(last) ?? undefined : undefined;
});

function isDayWithinProgramBounds(ymd: string): boolean {
    const min = programStartYmd.value;
    const max = programEndYmd.value;
    if (min.length > 0 && ymd < min) {
        return false;
    }
    if (max.length > 0 && ymd > max) {
        return false;
    }
    return true;
}

function isDaySelectable(dayHash: string): boolean {
    const ymd = qDateDayHashToIsoYmd(dayHash);
    return isDayWithinProgramBounds(ymd);
}

function hasTripOnDay(dayHash: string): boolean {
    const ymd = qDateDayHashToIsoYmd(dayHash);
    return tripDateYmdSet.value.has(ymd);
}

function onDatePicked(value: string | null): void {
    const ymd = normalizeCalendarYmd(value);
    if (ymd == null) {
        return;
    }
    selectedDateYmd.value = ymd;
    dateDialogOpen.value = false;
}
</script>
