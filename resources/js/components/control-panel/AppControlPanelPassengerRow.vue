<template>
    <q-item dense>
        <q-item-section>{{ name }}</q-item-section>
        <q-item-section v-if="!readOnly" side>
            <q-btn
                flat
                dense
                round
                color="negative"
                icon="person_remove"
                :aria-label="t('programsControl.removePassenger')"
                @click="emit('remove')"
            />
        </q-item-section>
    </q-item>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

defineProps<{
    name: string;
    readOnly?: boolean;
}>();

const emit = defineEmits<{
    remove: [];
}>();

const { t } = useI18n();
</script>
