<template>
    <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col-auto row items-center q-gutter-xs">
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
                            @update:model-value="onDatePicked"
                        />
                    </q-card-section>
                </q-card>
            </q-dialog>
        </div>

        <q-space />

        <div class="col-auto row q-gutter-sm">
            <q-chip outline color="primary">
                {{ t('programsControl.statsTotal') }}: {{ stats.total }}
            </q-chip>
            <q-chip outline color="secondary">
                {{ t('programsControl.statsBooked') }}: {{ stats.booked }}
            </q-chip>
            <q-chip outline color="positive">
                {{ t('programsControl.statsReturned') }}: {{ stats.returned }}
            </q-chip>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ControlPanelDayStats } from '../../utilities/control-panel-day-board';

defineProps<{
    stats: ControlPanelDayStats;
}>();

const selectedDateYmd = defineModel<string>('selectedDateYmd', { required: true });

const emit = defineEmits<{
    'prev-day': [];
    'next-day': [];
    'go-today': [];
}>();

const { t, locale } = useI18n();
const dateDialogOpen = ref(false);

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
        selectedDateYmd.value = value?.trim() ?? '';
    },
});

function onDatePicked(value: string | null): void {
    if (value != null && String(value).trim().length > 0) {
        dateDialogOpen.value = false;
    }
}
</script>
