<template>
    <q-page class="max-w-[600px] mx-auto">

        <q-banner v-if="errorMessage" class="bg-red-1 text-negative mb-4" rounded>
            {{ errorMessage }}
        </q-banner>

        <div v-if="isLoading" class="row justify-center p-4">
            <q-spinner color="primary" size="48px" />
        </div>

        <template v-else-if="program">
            <section class="">
                <q-img :src="programBannerSrc" height="300px">
                    <div class="absolute-top">

                        <h1 class="text-h4 mb-2 text-weight-bold">{{ program.name }} </h1>
                    </div>
                    <div class="absolute-bottom">

                        <p v-if="program.description" class="text-subtitle2">


                            {{ program.description }}
                        </p>
                    </div>
                </q-img>


            </section>

            <section v-if="createdBooking" class="row justify-center py-12">
                <q-card class="full-width" style="max-width: 560px;" flat bordered>
                    <q-card-section class="column items-center text-center gap-2">
                        <q-icon name="check_circle" color="positive" size="52px" />
                        <div class="text-h5 text-weight-bold">{{ t('publicBooking.successTitle') }}</div>
                        <p class="text-body1 text-grey-8 mb-2">
                            {{
                                t('publicBooking.successBody', {
                                    id: createdBooking.id,
                                    total: String(createdBooking.total_tickets),
                                })
                            }}
                        </p>
                        <p v-if="createdBooking.contact_email" class="text-body2 text-grey-7">
                            {{
                                t('publicBooking.successEmailSent', {
                                    email: createdBooking.contact_email,
                                })
                            }}
                        </p>
                        <q-btn color="primary" no-caps :label="t('publicBooking.bookAnother')" @click="onBookAnother" />
                    </q-card-section>
                </q-card>
            </section>

            <q-stepper v-else-if="hasBookingFlow" v-model="step" color="primary" animated flat bordered
                class="public-booking-stepper">
                <q-step :name="1" :title="t('publicBooking.stepTrip')" :done="step > 1">
                    <PublicProgramBookingTripStep :key="tripStepResetKey" :trip-options="tripOptions"
                        :program-timezone="programTimezone"
                        v-model:selected-product-id="selectedTripProductId"
                        v-model:selected-date-ymd="selectedTripDateYmd" :program-start-date-ymd="program?.start_date"
                        :program-end-date-ymd="program?.end_date" @continue="goToTicketsStep" />
                </q-step>

                <q-step :name="2" :title="t('publicBooking.stepTickets')" :done="step > 2" :disable="!canAccessStep2"
                    :header-nav="canAccessStep2">
                    <PublicProgramBookingTicketsStep v-model:ticket-quantities="ticketQuantities"
                        :ticket-errors="step2TicketErrors" :can-continue="canAccessStep3"
                        :ticket-type-options="ticketTypeOptions" :format-ticket-type-price="formatTicketTypePrice"
                        :selected-trip="selectedTrip" @back="step = 1" @continue="goToContactStep" />
                </q-step>

                <q-step :name="3" :title="t('publicBooking.stepContact')" :disable="!canAccessStep3"
                    :header-nav="canAccessStep3">
                    <PublicProgramBookingContactStep v-model:contact-name="contactName"
                        v-model:contact-email="contactEmail" v-model:country="country"
                        :contact-name-props="contactNameProps" :contact-email-props="contactEmailProps"
                        :country-props="countryProps" :submit-error="submitError" v-model:custom-answers="customAnswers"
                        :custom-questions="customQuestions" :custom-answer-errors="customAnswerErrors"
                        :is-submitting="isSubmitting" :can-submit="canSubmitContactStep" @back="step = 2"
                        @submit="onContactSubmit" />
                </q-step>
            </q-stepper>

            <div v-else class="column gap-2">
                <q-banner v-if="tripOptions.length === 0" rounded outline class="text-grey-8">
                    {{ t('publicBooking.noTrips') }}
                </q-banner>
                <q-banner v-if="ticketTypeOptions.length === 0" rounded outline class="text-grey-8">
                    {{ t('publicBooking.noTicketTypes') }}
                </q-banner>
            </div>
        </template>
    </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { bookingOptions, store } from '../actions/App/Http/Controllers/Api/PublicBookingController';
import { show } from '../routes/api/public/programs';
import PublicProgramBookingContactStep from '../components/public-program/PublicProgramBookingContactStep.vue';
import PublicProgramBookingTicketsStep from '../components/public-program/PublicProgramBookingTicketsStep.vue';
import PublicProgramBookingTripStep from '../components/public-program/PublicProgramBookingTripStep.vue';
import {
    PublicApiRequestError,
    fetchPublicJson,
    postPublicJson,
} from '../services/publicApi';
import { programBannerUrlFromUrl } from '../utilities/program-banner-url';
import { validatePublicBookingTickets } from '../utilities/public-booking-validation';
import {
    createPublicBookingContactFormSchema,
    type PublicBookingContactFormValues,
} from '../models/public-booking/public-booking.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { DEFAULT_COUNTRY_CODE } from '../composables/useCountryOptions';
import type {
    BookingOptionsPayload,
    BookingTicketTypeOption,
    BookingTripOption,
    CreatedBookingPayload,
} from '../models/public-booking/public-booking.types';

const props = defineProps<{
    identifier: string;
}>();

type PublicProgram = {
    id?: string;
    name?: string;
    description?: string;
    banner_url?: string | null;
    start_date?: string;
    end_date?: string;
    timezone?: string;
};

const { t, locale } = useI18n();

const isLoading = ref(true);
const errorMessage = ref('');
const program = ref<PublicProgram | null>(null);

const bookingOptionsData = ref<BookingOptionsPayload | null>(null);

const step = ref(1);
const tripStepResetKey = ref(0);
const selectedTripId = ref('');
const selectedTripProductId = ref('');
const selectedTripDateYmd = ref('');
const ticketQuantities = ref<Record<string, number>>({});
const submitError = ref('');
const createdBooking = ref<CreatedBookingPayload | null>(null);
const customAnswers = ref<string[]>([]);
const customAnswerErrors = ref<Record<number, string>>({});

const contactSchema = createPublicBookingContactFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm } = useForm<PublicBookingContactFormValues>({
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

const tripOptions = computed((): BookingTripOption[] => bookingOptionsData.value?.trips ?? []);
const programTimezone = computed(
    () => String(program.value?.timezone ?? 'America/Toronto').trim() || 'America/Toronto',
);
const ticketTypeOptions = computed((): BookingTicketTypeOption[] => bookingOptionsData.value?.ticket_types ?? []);
const customQuestions = computed((): string[] => bookingOptionsData.value?.booking_questions ?? []);
const programBannerSrc = computed((): string =>
    programBannerUrlFromUrl(program.value?.banner_url),
);

const hasBookingFlow = computed(
    () => tripOptions.value.length > 0 && ticketTypeOptions.value.length > 0,
);

const selectedTrip = computed((): BookingTripOption | undefined =>
    tripOptions.value.find((x) => String(x.id) === selectedTripId.value),
);

const ticketValidationState = computed(() =>
    validatePublicBookingTickets({
        ticketTypeOptions: ticketTypeOptions.value,
        ticketQuantities: ticketQuantities.value,
        selectedTrip: selectedTrip.value,
        t,
    }),
);

const step2TicketErrors = computed(() => ticketValidationState.value.errors);

const canAccessStep2 = computed(() => selectedTrip.value !== undefined);
const canAccessStep3 = computed(() => canAccessStep2.value && ticketValidationState.value.canContinue);
const canSubmitContactStep = computed(() => {
    if (!meta.value.valid) {
        return false;
    }

    return customQuestions.value.every((_, index) => {
        const answer = customAnswers.value[index];
        return typeof answer === 'string' && answer.trim().length > 0;
    });
});

function formatTicketTypePrice(tt: BookingTicketTypeOption): string {
    if (tt.is_pay_what_you_can) {
        return t('publicBooking.payWhatYouCan');
    }
    if (tt.price_cents == null) {
        return '—';
    }
    const amount = new Intl.NumberFormat(String(locale.value), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(tt.price_cents / 100);
    return t('publicBooking.priceFromCents', { amount });
}

function initTicketQuantities(types: BookingTicketTypeOption[]): void {
    const m: Record<string, number> = {};
    for (const tt of types) {
        m[String(tt.id)] = 0;
    }
    ticketQuantities.value = m;
}

async function loadBookingOptionsOnly(): Promise<void> {
    try {
        const path = bookingOptions.url(props.identifier);
        const j = await fetchPublicJson(path);
        if (j && typeof j === 'object' && 'data' in j && (j as { data: unknown }).data) {
            const d = (j as { data: BookingOptionsPayload }).data;
            bookingOptionsData.value = d;
            initTicketQuantities(d.ticket_types);
            const questions = Array.isArray(d.booking_questions) ? d.booking_questions : [];
            customAnswers.value = questions.map(() => '');
            customAnswerErrors.value = {};
        } else {
            bookingOptionsData.value = null;
            customAnswers.value = [];
            customAnswerErrors.value = {};
        }
    } catch {
        bookingOptionsData.value = null;
        customAnswers.value = [];
        customAnswerErrors.value = {};
    }
}

async function load(): Promise<void> {
    isLoading.value = true;
    errorMessage.value = '';
    program.value = null;
    bookingOptionsData.value = null;
    createdBooking.value = null;
    step.value = 1;
    tripStepResetKey.value += 1;
    selectedTripId.value = '';
    selectedTripProductId.value = '';
    selectedTripDateYmd.value = '';
    submitError.value = '';
    resetForm();

    const [pRes, oRes] = await Promise.allSettled([
        fetchPublicJson(show.url(props.identifier)),
        fetchPublicJson(bookingOptions.url(props.identifier)),
    ]);

    if (pRes.status === 'fulfilled') {
        const j = pRes.value;
        if (j && typeof j === 'object' && 'data' in j && (j as { data: unknown }).data) {
            program.value = (j as { data: PublicProgram }).data;
        } else {
            program.value = null;
            errorMessage.value = t('publicProgram.notFound');
        }
    } else {
        program.value = null;
        errorMessage.value = t('publicProgram.notFound');
    }

    if (oRes.status === 'fulfilled') {
        const j = oRes.value;
        if (j && typeof j === 'object' && 'data' in j && (j as { data: unknown }).data) {
            const d = (j as { data: BookingOptionsPayload }).data;
            bookingOptionsData.value = d;
            initTicketQuantities(d.ticket_types);
            const questions = Array.isArray(d.booking_questions) ? d.booking_questions : [];
            customAnswers.value = questions.map(() => '');
            customAnswerErrors.value = {};
        }
    }

    isLoading.value = false;
}

function goToTicketsStep(tripId: string): void {
    const id = tripId.trim();
    if (id.length === 0) {
        return;
    }
    selectedTripId.value = id;
    step.value = 2;
}

function goToContactStep(): void {
    submitError.value = '';
    if (!canAccessStep3.value) {
        step.value = canAccessStep2.value ? 2 : 1;
        return;
    }

    step.value = 3;
}

const onContactSubmit = handleSubmit(async (values) => {
    submitError.value = '';
    const trip = selectedTrip.value;
    if (trip === undefined) {
        submitError.value = t('publicBooking.selectTripFirst');
        return;
    }

    const quantities: Record<string, number> = {};
    for (const tt of ticketTypeOptions.value) {
        const raw = ticketQuantities.value[String(tt.id)];
        const q = typeof raw === 'number' && !Number.isNaN(raw) ? Math.max(0, Math.floor(raw)) : 0;
        quantities[String(tt.id)] = q;
    }

    const payload: Record<string, unknown> = {
        trip_id: String(trip.id),
        ticket_quantities: quantities,
        contact_name: String(values.contact_name).trim(),
        contact_email: String(values.contact_email).trim(),
        country: String(values.country).trim().toUpperCase(),
        locale: String(locale.value) === 'fr' ? 'fr' : 'en',
    };

    if (customQuestions.value.length > 0) {
        const answerErrors: Record<number, string> = {};
        payload.custom_answers = customQuestions.value.map((question, index) => {
            const answer = String(customAnswers.value[index] ?? '').trim();
            if (answer.length === 0) {
                answerErrors[index] = t('publicBooking.customAnswerRequired', { question });
            }

            return answer;
        });
        customAnswerErrors.value = answerErrors;
        if (Object.keys(answerErrors).length > 0) {
            return;
        }
    } else {
        customAnswerErrors.value = {};
    }

    try {
        const j = await postPublicJson(store.url(props.identifier), payload);
        if (j && typeof j === 'object' && 'data' in j && (j as { data: unknown }).data) {
            createdBooking.value = (j as { data: CreatedBookingPayload }).data;
        } else {
            submitError.value = t('publicBooking.loadOptionsError');
        }
    } catch (e) {
        if (e instanceof PublicApiRequestError) {
            submitError.value = e.message.length > 0 ? e.message : t('publicBooking.loadOptionsError');
        } else {
            submitError.value = t('publicBooking.loadOptionsError');
        }
    }
});

function onBookAnother(): void {
    createdBooking.value = null;
    step.value = 1;
    tripStepResetKey.value += 1;
    selectedTripId.value = '';
    selectedTripProductId.value = '';
    selectedTripDateYmd.value = '';
    submitError.value = '';
    customAnswerErrors.value = {};
    resetForm();
    if (bookingOptionsData.value !== null) {
        initTicketQuantities(bookingOptionsData.value.ticket_types);
        customAnswers.value = customQuestions.value.map(() => '');
    } else {
        void loadBookingOptionsOnly();
    }
}

watch(
    () => props.identifier,
    () => {
        void load();
    },
    { immediate: true },
);

watch(selectedTripId, (id) => {
    if (id.trim().length === 0 && step.value > 1) {
        step.value = 1;
    }
});

watch(step, (nextStep) => {
    if (nextStep >= 3 && !canAccessStep3.value) {
        step.value = canAccessStep2.value ? 2 : 1;
        return;
    }

    if (nextStep >= 2 && !canAccessStep2.value) {
        step.value = 1;
    }
});
</script>

<style scoped>
.public-booking-stepper :deep(.q-stepper__step-inner) {
    padding-inline: 0;
}
</style>
