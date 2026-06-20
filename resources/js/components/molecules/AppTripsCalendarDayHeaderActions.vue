<template>
    <div
        class="row items-start wrap gap-1 [&_.q-btn]:max-w-full [&_.q-btn-dropdown]:max-w-full"
        :class="compact && '[&_.q-btn]:min-w-7 [&_.q-btn]:px-1'"
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