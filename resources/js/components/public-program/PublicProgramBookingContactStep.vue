<template>
    <q-form class="column q-gutter-md" @submit="emit('submit', $event)">
        <q-banner v-if="submitError.length > 0" rounded class="bg-red-1 text-negative">
            {{ submitError }}
        </q-banner>
        <q-input
            v-model="contactName"
            v-bind="contactNameProps"
            outlined
            :disable="isSubmitting"
            :label="t('publicBooking.contactName')"
        />
        <q-input
            v-model="contactEmail"
            v-bind="contactEmailProps"
            outlined
            type="email"
            :disable="isSubmitting"
            :label="t('publicBooking.contactEmail')"
        />
        <div class="row q-gutter-sm q-mt-sm justify-between">
            <q-btn flat no-caps color="primary" :label="t('publicBooking.back')" @click="emit('back')" />
            <q-btn
                color="primary"
                no-caps
                type="submit"
                :label="t('publicBooking.submitBook')"
                :loading="isSubmitting"
                :disable="!canSubmit || isSubmitting"
            />
        </div>
    </q-form>
</template>

<script setup lang="ts">
import type { BaseFieldProps } from 'vee-validate';
import { useI18n } from 'vue-i18n';

type QuasarVeeFieldProps = BaseFieldProps & { error: boolean; errorMessage: string };

defineProps<{
    contactNameProps: QuasarVeeFieldProps;
    contactEmailProps: QuasarVeeFieldProps;
    submitError: string;
    isSubmitting: boolean;
    canSubmit: boolean;
}>();

const emit = defineEmits<{
    submit: [Event];
    back: [];
}>();

const contactName = defineModel<string>('contactName', { required: true });
const contactEmail = defineModel<string>('contactEmail', { required: true });

const { t } = useI18n();
</script>
