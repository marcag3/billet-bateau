<template>
    <div class="row items-center gap-2 mb-4">
        <div class="col-auto row items-center gap-1">
            <q-btn
                flat
                round
                dense
                icon="chevron_left"
                :aria-label="t('programsControl.prevDay')"
                :disable="showAllDates"
                @click="emit('prev-day')"
            />
            <q-btn
                flat
                dense
                no-caps
                :label="t('programsControl.today')"
                :disable="showAllDates"
                @click="emit('go-today')"
            />
            <q-btn
                flat
                round
                dense
                icon="chevron_right"
                :aria-label="t('programsControl.nextDay')"
                :disable="showAllDates"
                @click="emit('next-day')"
            />
        </div>

        <div class="col-auto">
            <q-btn
                outline
                no-caps
                icon="event"
                :label="dateLabel"
                :disable="showAllDates"
                @click="dateDialogOpen = true"
            />
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

        <div class="col-auto">
            <q-toggle
                v-model="showAllDates"
                dense
                :label="t('programsControlAdmin.showAllDates')"
            />
        </div>

        <q-space />

        <slot name="trailing" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { normalizeCalendarYmd } from '../../utilities/control-panel-day-board';

const selectedDateYmd = defineModel<string>('selectedDateYmd', { required: true });
const showAllDates = defineModel<boolean>('showAllDates', { default: false });

const emit = defineEmits<{
    'prev-day': [];
    'next-day': [];
    'go-today': [];
}>();

const { t, locale } = useI18n();
const dateDialogOpen = ref(false);

const dateLabel = computed((): string => {
    if (showAllDates.value) {
        return t('programsControlAdmin.allDates');
    }
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

function onDatePicked(value: string | null): void {
    const ymd = normalizeCalendarYmd(value);
    if (ymd == null) {
        return;
    }
    selectedDateYmd.value = ymd;
    showAllDates.value = false;
    dateDialogOpen.value = false;
}
</script>
