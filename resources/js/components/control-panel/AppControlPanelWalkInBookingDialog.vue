<template>
    <q-dialog v-model="openModel" persistent>
        <q-card style="min-width: 320px; max-width: 520px">
            <q-card-section class="text-h6">
                {{ t('programsControl.addWalkIn') }}
            </q-card-section>

            <q-form @submit="onSubmit">
                <q-card-section class="column gap-4">
                    <AppTicketQuantityPicker
                        ref="ticketPickerRef"
                        v-model:ticket-quantities="ticketQuantities"
                        :ticket-type-options="ticketTypeOptions"
                        :format-ticket-type-price="formatTicketTypePrice"
                        :ticket-errors="ticketErrors"
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
import type { BookingTicketTypeOption } from '../../models/public-booking/public-booking.types';
import { createPublicBookingContactFormSchema } from '../../models/public-booking/public-booking.validation';
import { createQuasarFieldBinder } from '../../validation/quasar-vee-fields';
import { DEFAULT_COUNTRY_CODE } from '../../composables/useCountryOptions';
import { validateWalkInBookingTickets } from '../../utilities/public-booking-validation';
import AppCountrySelect from '../molecules/AppCountrySelect.vue';
import AppTicketQuantityPicker from '../molecules/AppTicketQuantityPicker.vue';

export type WalkInBookingConfirmPayload = {
    ticketQuantities: Record<string, number>;
    contactName: string;
    contactEmail: string;
    country: string;
    customFieldMap: Record<string, string>;
};

const props = defineProps<{
    open: boolean;
    ticketTypeOptions: BookingTicketTypeOption[];
    formatTicketTypePrice: (tt: BookingTicketTypeOption) => string;
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

const ticketQuantities = ref<Record<string, number>>({});
const ticketErrors = ref<Record<string, string>>({});
const ticketPickerRef = ref<InstanceType<typeof AppTicketQuantityPicker> | null>(null);
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

function initTicketQuantities(): void {
    const quantities: Record<string, number> = {};
    for (const ticketType of props.ticketTypeOptions) {
        quantities[String(ticketType.id)] = 0;
    }
    ticketQuantities.value = quantities;
}

function resetDialogState(): void {
    ticketErrors.value = {};
    initTicketQuantities();
    ticketPickerRef.value?.resetTouchedState();
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
    ticketErrors.value = {};
    customAnswerErrors.value = {};

    const validation = validateWalkInBookingTickets({
        ticketTypeOptions: props.ticketTypeOptions,
        ticketQuantities: ticketQuantities.value,
        bookedCount: props.bookedCount,
        tripCapacity: props.tripCapacity,
        t,
    });

    if (!validation.canContinue) {
        ticketErrors.value = validation.errors;
        for (const ticketTypeId of Object.keys(validation.errors)) {
            ticketPickerRef.value?.markTicketTouched(ticketTypeId);
        }
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
        ticketQuantities: { ...ticketQuantities.value },
        contactName: String(values.contact_name).trim(),
        contactEmail: String(values.contact_email).trim(),
        country: String(values.country).trim().toUpperCase(),
        customFieldMap,
    });
    emit('update:open', false);
});
</script>
