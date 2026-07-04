<template>
    <div class="row items-center gap-2 mb-4 flex-nowrap overflow-x-auto">
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

        <div class="col-auto shrink-0">
            <q-chip
                outline
                :style="controlPanelStatChipStyle('totalPassengers')"
                :clickable="statsDetailsOnClick"
                :aria-label="t('programsControl.statsDayTotal')"
                :aria-haspopup="statsDetailsOnClick ? 'true' : undefined"
                :aria-expanded="statsDetailsOnClick && statsMenuOpen ? 'true' : undefined"
            >
                {{ t('programsControl.statsDayTotal') }}:
                {{ stats.totalPassengers }}/{{ stats.places }}
                <q-tooltip v-if="!statsDetailsOnClick">
                    <div v-for="row in statDetailRows" :key="row.key">
                        {{ row.label }}: {{ row.value }}
                    </div>
                </q-tooltip>
                <q-menu
                    v-if="statsDetailsOnClick"
                    v-model="statsMenuOpen"
                    anchor="bottom middle"
                    self="top middle"
                    transition-show="jump-down"
                    transition-hide="jump-up"
                >
                    <q-list dense class="q-py-xs">
                        <q-item v-for="row in statDetailRows" :key="row.key" dense>
                            <q-item-section>{{ row.label }}: {{ row.value }}</q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </q-chip>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
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
const $q = useQuasar();
const dateDialogOpen = ref(false);
const statsMenuOpen = ref(false);

const statsDetailsOnClick = computed(() => $q.platform.has.touch);

const statDetailRows = computed(() => [
    { key: 'booked', label: t('programsControl.statsBooked'), value: props.stats.booked },
    { key: 'checkedIn', label: t('programsControl.statsCheckedIn'), value: props.stats.checkedIn },
    { key: 'onWater', label: t('programsControl.statsOnWater'), value: props.stats.onWater },
    { key: 'returned', label: t('programsControl.statsReturned'), value: props.stats.returned },
]);

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
