<template>
    <AppEntityCreatePageLayout
        :title="t('programsControlAdmin.createBookingTitle')"
        :back-to="backTo"
        :back-label="t('programsControlAdmin.backToBookings')"
    >
        <AppCardSection :label="t('programsControlAdmin.bookingDetails')">
            <q-form @submit.prevent="onCreateSubmit">
                <div class="column gap-4">
                    <q-select
                        v-model="tripId"
                        v-bind="tripIdProps"
                        outlined
                        emit-value
                        map-options
                        :options="tripOptions"
                        :label="t('programsControlAdmin.trip')"
                        :disable="isSubmitting"
                    />
                    <q-input
                        v-model="contactName"
                        v-bind="contactNameProps"
                        outlined
                        :label="t('publicBooking.contactName')"
                        :disable="isSubmitting"
                    />
                    <q-input
                        v-model="contactEmail"
                        v-bind="contactEmailProps"
                        outlined
                        type="email"
                        :label="t('publicBooking.contactEmailOptional')"
                        :disable="isSubmitting"
                    />
                    <q-input
                        v-model="contactPhone"
                        v-bind="contactPhoneProps"
                        outlined
                        type="tel"
                        :label="t('publicBooking.contactPhone')"
                        :disable="isSubmitting"
                    />
                    <AppCountrySelect
                        v-model="country"
                        v-bind="countryProps"
                        :label="t('publicBooking.country')"
                        :disable="isSubmitting"
                    />
                    <AppBookingCustomQuestionsFields
                        v-if="bookingQuestions.length > 0"
                        v-model:answers="customAnswers"
                        :questions="bookingQuestions"
                        :errors="customAnswerErrors"
                        :disabled="isSubmitting"
                    />
                    <q-select
                        v-model="ticketTypeId"
                        outlined
                        emit-value
                        map-options
                        :options="ticketTypeOptions"
                        :label="t('programsControl.ticketType')"
                        :disable="isSubmitting"
                    />
                    <q-btn
                        color="primary"
                        type="submit"
                        :label="t('programsControlAdmin.createBooking')"
                        :loading="isSubmitting"
                        :disable="!canCreateBooking"
                        class="self-start"
                    />
                </div>
            </q-form>
        </AppCardSection>
    </AppEntityCreatePageLayout>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import {
    createBookingAdminFormSchema,
    type BookingAdminFormValues,
} from '../models/bookings/bookings.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { DEFAULT_COUNTRY_CODE } from '../composables/useCountryOptions';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { liveQueryRows } from '../powersync/live-query-casts';
import { useBookingAdminCrud } from '../composables/useBookingAdminCrud';
import { useProgramTripSelectOptions } from '../composables/useProgramTripSelectOptions';
import { useNotifyAsyncAction } from '../composables/useNotifyAsyncAction';
import { controlContextNamedRoute } from '../utilities/control-context-route';
import {
    parseProgramBookingQuestions,
    validateBookingCustomAnswers,
} from '../utilities/program-booking-questions';
import AppEntityCreatePageLayout from '../layouts/AppEntityCreatePageLayout.vue';
import AppCardSection from '../components/ui/AppCardSection.vue';
import AppCountrySelect from '../components/molecules/AppCountrySelect.vue';
import AppBookingCustomQuestionsFields from '../components/molecules/AppBookingCustomQuestionsFields.vue';

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { addWalkInBooking } = useBookingAdminCrud();
const { runWithNotify } = useNotifyAsyncAction();

const ticketTypeId = ref('');
const customAnswers = ref<string[]>([]);
const customAnswerErrors = ref<Record<number, string>>({});

const programId = computed(() => String(route.params.programId ?? '').trim());

const backTo = computed(() => controlContextNamedRoute(route, 'control.bookings.list'));

const schema = createBookingAdminFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting } = useForm<BookingAdminFormValues>({
    validationSchema: schema,
    initialValues: {
        tripId: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        country: DEFAULT_COUNTRY_CODE,
    },
});

const quasarField = createQuasarFieldBinder(defineField);
const [tripId, tripIdProps] = quasarField('tripId');
const [contactName, contactNameProps] = quasarField('contact_name');
const [contactEmail, contactEmailProps] = quasarField('contact_email');
const [contactPhone, contactPhoneProps] = quasarField('contact_phone');
const [country, countryProps] = quasarField('country');

const { tripOptions } = useProgramTripSelectOptions({ excludePastTrips: true });

const { data: programRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.programs.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return qb
            .from({ p: col })
            .where(({ p }) => eq(p.id, pid))
            .select(({ p }) => ({ booking_questions: p.booking_questions }));
    },
    [powersync.collections.programs, powersync.activeProgramIdRef],
);

const bookingQuestions = computed(() =>
    parseProgramBookingQuestions(
        liveQueryRows<{ booking_questions: unknown }>(programRaw.value)[0]?.booking_questions,
    ),
);

watch(
    bookingQuestions,
    (questions) => {
        customAnswers.value = questions.map(() => '');
        customAnswerErrors.value = {};
    },
    { immediate: true },
);

const customAnswersValid = computed(() => {
    if (bookingQuestions.value.length === 0) {
        return true;
    }

    return (
        validateBookingCustomAnswers({
            questions: bookingQuestions.value,
            answers: customAnswers.value,
            t,
        }).customFieldMap !== null
    );
});

const canCreateBooking = computed(
    () =>
        meta.value.valid &&
        !isSubmitting.value &&
        programId.value.length > 0 &&
        ticketTypeId.value.trim().length > 0 &&
        customAnswersValid.value,
);

const { data: ticketTypesRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.ticket_types.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return qb.from({ tt: col }).where(({ tt }) => eq(tt.program_id, pid));
    },
    [powersync.collections.ticket_types, powersync.activeProgramIdRef],
);

const ticketTypeOptions = computed(() =>
    liveQueryRows<{ id: string; title: string | null }>(ticketTypesRaw.value).map((tt) => ({
        value: String(tt.id),
        label: String(tt.title ?? '—'),
    })),
);

const onCreateSubmit = handleSubmit(async (values: BookingAdminFormValues) => {
    const customValidation = validateBookingCustomAnswers({
        questions: bookingQuestions.value,
        answers: customAnswers.value,
        t,
    });

    if (customValidation.customFieldMap === null) {
        customAnswerErrors.value = customValidation.errors;
        return;
    }

    await runWithNotify(
        async () => {
            const result = await addWalkInBooking({
                programId: programId.value,
                tripId: values.tripId,
                ticketQuantities: { [ticketTypeId.value]: 1 },
                contactName: values.contact_name,
                contactEmail: values.contact_email,
                contactPhone: values.contact_phone,
                country: values.country,
                customFieldMap: customValidation.customFieldMap ?? {},
            });
            if (result == null) {
                return;
            }
            await router.push(
                controlContextNamedRoute(route, 'control.bookings.edit', {
                    bookingId: result.bookingId,
                }),
            );
        },
        {
            successMessage: t('programsControlAdmin.bookingCreated'),
            errorGeneric: t('programsControl.errorGeneric'),
        },
    );
});
</script>
