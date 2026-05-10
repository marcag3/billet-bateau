<template>
    <div
        class="trips-cal-day-header-actions row items-start wrap"
        :class="{
            'trips-cal-day-header-actions--compact': compact,
        }"
        @click.stop
        @mousedown.stop
    >
        <q-btn-dropdown
            flat
            dense
            no-caps
            size="sm"
            color="primary"
            :icon="compact ? 'event_note' : undefined"
            :label="compact ? undefined : t('tripsCalendar.applyTemplateDay')"
            :aria-label="t('tripsCalendar.applyTemplateDay')"
            :disable="disabled || templateDays.length === 0"
        >
            <q-list dense style="min-width: 12rem">
                <q-item
                    v-for="td in templateDays"
                    :key="td.id"
                    v-close-popup
                    clickable
                    @click="$emit('apply', td.id)"
                >
                    <q-item-section>{{ td.name }}</q-item-section>
                </q-item>
                <q-item v-if="templateDays.length === 0">
                    <q-item-section class="text-grey text-caption">
                        {{ t("tripsCalendar.applyTemplateDayNoTemplates") }}
                    </q-item-section>
                </q-item>
            </q-list>
        </q-btn-dropdown>
        <q-btn
            flat
            dense
            no-caps
            size="sm"
            color="negative"
            icon="delete_sweep"
            :label="compact ? undefined : t('tripsCalendar.clearUnbookedTripsForDay')"
            :aria-label="t('tripsCalendar.clearUnbookedTripsForDay')"
            :disable="disabled"
            @click="$emit('clearUnbooked')"
        />
    </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

export interface TemplateDayOption {
    id: string;
    name: string;
}

defineProps<{
    /** Smaller controls (e.g. month grid cells). */
    compact?: boolean;
    disabled?: boolean;
    templateDays: TemplateDayOption[];
}>();

defineEmits<{
    apply: [templateDayId: string];
    clearUnbooked: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.trips-cal-day-header-actions {
    gap: 0.25rem;
}

.trips-cal-day-header-actions :deep(.q-btn),
.trips-cal-day-header-actions :deep(.q-btn-dropdown) {
    max-width: 100%;
}

.trips-cal-day-header-actions--compact :deep(.q-btn) {
    min-width: 1.75rem;
    padding-left: 0.25rem;
    padding-right: 0.25rem;
}
</style>
