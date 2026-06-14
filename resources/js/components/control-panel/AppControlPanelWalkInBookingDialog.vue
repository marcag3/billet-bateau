<template>
    <q-dialog v-model="openModel" persistent>
        <q-card style="min-width: 320px; max-width: 480px">
            <q-card-section class="text-h6">
                {{ t('programsControl.addWalkIn') }}
            </q-card-section>

            <q-form @submit="onSubmit">
                <q-card-section class="column q-gutter-md">
                    <q-select
                        v-model="ticketTypeId"
                        outlined
                        emit-value
                        map-options
                        :options="ticketTypeOptions"
                        :label="t('programsControl.ticketType')"
                        :error="ticketTypeError.length > 0"
                        :error-message="ticketTypeError"
                    />

                    <q-input
                        v-model="contactName"
                        v-bind="contactNameProps"
                        outlined
                        :label="t('publicBooking.contactName')"
                    />
                    <q-input
                        v-model="contactEmail"
                        v-bind="contactEmailProps"
                        outlined
                        type="email"
                        :label="t('publicBooking.contactEmail')"
                    />

                    <AppCountrySelect
                        v-model="country"
                        v-bind="countryProps"
                        :label="t('publicBooking.country')"
                    />

                    <q-input
                        v-for="(question, index) in bookingQuestions"
                        :key="`${index}-${question}`"
                        v-model="customAnswers[index]"
                        outlined
                        :label="question"
                        :error="customAnswerErrors[index] !== undefined"
                        :error-message="customAnswerErrors[index] ?? ''"
                    />
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn v-close-popup flat no-caps :label="t('common.cancel')" />
                    <q-btn color="primary" no-caps type="submit" :label="t('common.save')" />
                </q-card-actions>
            </q-form>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { createPublicBookingContactFormSchema } from '../../models/public-booking/public-booking.validation';
import { createQuasarFieldBinder } from '../../validation/quasar-vee-fields';
import { DEFAULT_COUNTRY_CODE } from '../../composables/useCountryOptions';
import AppCountrySelect from '../molecules/AppCountrySelect.vue';

export type WalkInTicketTypeOption = {
    value: string;
    label: string;
};

export type WalkInBookingConfirmPayload = {
    ticketTypeId: string;
    contactName: string;
    contactEmail: string;
    country: string;
    customFieldMap: Record<string, string>;
};

const props = defineProps<{
    open: boolean;
    ticketTypeOptions: WalkInTicketTypeOption[];
    bookingQuestions: string[];
    bookedCount: number;
    tripCapacity: number | null;
}>();

const emit = defineEmits<{
    'update:open': [value: boolean];
    confirm: [payload: WalkInBookingConfirmPayload];
}>();

const { t } = useI18n();

const openModel = computed({
    get: () => props.open,
    set: (value: boolean) => emit('update:open', value),
});

const ticketTypeId = ref('');
const ticketTypeError = ref('');
const customAnswers = ref<string[]>([]);
const customAnswerErrors = ref<Record<number, string>>({});

const contactSchema = createPublicBookingContactFormSchema(t);
const { handleSubmit, defineField, resetForm } = useForm({
    validationSchema: contactSchema,
    initialValues: {
        contact_name: '',
        contact_email: '',
        country: DEFAULT_COUNTRY_CODE,
    },
});

const quasarField = createQuasarFieldBinder(defineField);
const [contactName, contactNameProps] = quasarField('contact_name');
const [contactEmail, contactEmailProps] = quasarField('contact_email');
const [country, countryProps] = quasarField('country');

function resetDialogState(): void {
    ticketTypeId.value = '';
    ticketTypeError.value = '';
    customAnswerErrors.value = {};
    customAnswers.value = props.bookingQuestions.map(() => '');
    resetForm({
        values: {
            contact_name: '',
            contact_email: '',
            country: DEFAULT_COUNTRY_CODE,
        },
    });
}

watch(
    () => props.open,
    (isOpen) => {
        if (isOpen) {
            resetDialogState();
        }
    },
);

watch(
    () => props.bookingQuestions,
    (questions) => {
        if (!props.open) {
            return;
        }
        customAnswers.value = questions.map(() => '');
    },
);

const onSubmit = handleSubmit((values) => {
    ticketTypeError.value = '';
    customAnswerErrors.value = {};

    const selectedTicketTypeId = ticketTypeId.value.trim();
    if (selectedTicketTypeId.length === 0) {
        ticketTypeError.value = t('programsControl.ticketTypeRequired');
        return;
    }

    const capacity = props.tripCapacity;
    if (
        capacity != null &&
        Number.isFinite(Number(capacity)) &&
        props.bookedCount + 1 > Math.max(0, Math.floor(Number(capacity)))
    ) {
        ticketTypeError.value = t('programsControl.capacityFull');
        return;
    }

    const answerErrors: Record<number, string> = {};
    const customFieldMap: Record<string, string> = {};
    props.bookingQuestions.forEach((question, index) => {
        const answer = String(customAnswers.value[index] ?? '').trim();
        if (answer.length === 0) {
            answerErrors[index] = t('publicBooking.customAnswerRequired', { question });
        } else {
            customFieldMap[question] = answer;
        }
    });

    if (Object.keys(answerErrors).length > 0) {
        customAnswerErrors.value = answerErrors;
        return;
    }

    emit('confirm', {
        ticketTypeId: selectedTicketTypeId,
        contactName: String(values.contact_name).trim(),
        contactEmail: String(values.contact_email).trim(),
        country: String(values.country).trim().toUpperCase(),
        customFieldMap,
    });
    emit('update:open', false);
});
</script>
