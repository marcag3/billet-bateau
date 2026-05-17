<template>
    <q-page>
        <q-btn
            flat
            no-caps
            color="primary"
            :label="t('publicProgram.backToCatalog')"
            :to="{ name: 'public.home' }"
            class="q-mb-md"
        />

        <q-banner v-if="errorMessage" class="bg-red-1 text-negative q-mb-md" rounded>
            {{ errorMessage }}
        </q-banner>

        <div v-if="isLoading" class="row justify-center q-pa-xl">
            <q-spinner color="primary" size="48px" />
        </div>

        <template v-else-if="program">
            <section class="program-surface q-mb-lg">
                <h1 class="text-h4 q-mb-sm text-weight-bold">{{ program.name }}
                     <q-avatar>
                        <q-img
                            v-if="program.banner_url"
                            :src="program.banner_url"
                            :ratio="1/1"
                        />
                     </q-avatar>
                </h1>
                <p v-if="program.description" class="text-body1 text-grey-8 program-description">
                    {{ program.description }}
                </p>
            </section>

            <section v-if="createdBooking" class="program-surface">
                <q-banner class="bg-green-1 text-positive q-mb-md" rounded>
                    <div class="text-h6 q-mb-xs">{{ t('publicBooking.successTitle') }}</div>
                    <div class="text-body2">
                        {{
                            t('publicBooking.successBody', {
                                total: String(createdBooking.total_tickets),
                                id: createdBooking.id,
                            })
                        }}
                    </div>
                </q-banner>
                <q-btn
                    color="primary"
                    no-caps
                    outline
                    :label="t('publicBooking.bookAnother')"
                    @click="onBookAnother"
                />
            </section>

            <section v-else class="program-surface">
                <h2 class="text-h5 q-mb-md text-weight-bold">{{ t('publicBooking.bookTitle') }}</h2>

                <q-banner v-if="optionsError" class="bg-red-1 text-negative q-mb-md" rounded>
                    {{ optionsError }}
                </q-banner>

                <q-banner v-else-if="step2Error" class="bg-orange-1 text-deep-orange-10 q-mb-md" rounded>
                    {{ step2Error }}
                </q-banner>

                <q-banner v-if="submitError" class="bg-red-1 text-negative q-mb-md" rounded>
                    {{ submitError }}
                </q-banner>

                <q-stepper
                    v-if="hasBookingFlow"
                    v-model="step"
                    color="primary"
                    animated
                    flat
                    bordered
                    class="rounded-borders"
                >
                    <q-step :name="1" :title="t('publicBooking.stepTrip')" :done="step > 1">
                        <PublicProgramBookingTripStep
                            :key="tripStepResetKey"
                            v-model:selected-trip-id="selectedTripId"
                            :trip-options="tripOptions"
                            @continue="goToTicketsStep"
                        />
                    </q-step>

                    <q-step :name="2" :title="t('publicBooking.stepTickets')" :done="step > 2">
                        <PublicProgramBookingTicketsStep
                            v-model:ticket-quantities="ticketQuantities"
                            :ticket-type-options="ticketTypeOptions"
                            :format-ticket-type-price="formatTicketTypePrice"
                            @back="step = 1"
                            @continue="goToContactStep"
                        />
                    </q-step>

                    <q-step :name="3" :title="t('publicBooking.stepContact')">
                        <PublicProgramBookingContactStep
                            v-model:contact-name="contactName"
                            v-model:contact-email="contactEmail"
                            :contact-name-props="contactNameProps"
                            :contact-email-props="contactEmailProps"
                            :is-submitting="isSubmitting"
                            :can-submit="meta.valid"
                            @back="step = 2"
                            @submit="onContactSubmit"
                        />
                    </q-step>
                </q-stepper>

                <div v-else class="column q-gutter-sm">
                    <q-banner v-if="tripOptions.length === 0" rounded outline class="text-grey-8">
                        {{ t('publicBooking.noTrips') }}
                    </q-banner>
                    <q-banner v-if="ticketTypeOptions.length === 0" rounded outline class="text-grey-8">
                        {{ t('publicBooking.noTicketTypes') }}
                    </q-banner>
                </div>
            </section>
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
import {
    createPublicBookingContactFormSchema,
    type PublicBookingContactFormValues,
} from '../models/public-booking/public-booking.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
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
};

const { t, locale } = useI18n();

const isLoading = ref(true);
const errorMessage = ref('');
const program = ref<PublicProgram | null>(null);

const optionsError = ref('');
const bookingOptionsData = ref<BookingOptionsPayload | null>(null);

const step = ref(1);
const tripStepResetKey = ref(0);
const selectedTripId = ref('');
const ticketQuantities = ref<Record<string, number>>({});
const step2Error = ref('');
const submitError = ref('');
const createdBooking = ref<CreatedBookingPayload | null>(null);

const contactSchema = createPublicBookingContactFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm } = useForm<PublicBookingContactFormValues>({
    validationSchema: contactSchema,
    initialValues: {
        contact_name: '',
        contact_email: '',
    },
});

const quasarField = createQuasarFieldBinder(defineField);
const [contactName, contactNameProps] = quasarField('contact_name');
const [contactEmail, contactEmailProps] = quasarField('contact_email');

const tripOptions = computed((): BookingTripOption[] => bookingOptionsData.value?.trips ?? []);
const ticketTypeOptions = computed((): BookingTicketTypeOption[] => bookingOptionsData.value?.ticket_types ?? []);

const hasBookingFlow = computed(
    () => tripOptions.value.length > 0 && ticketTypeOptions.value.length > 0,
);

const selectedTrip = computed((): BookingTripOption | undefined =>
    tripOptions.value.find((x) => String(x.id) === selectedTripId.value),
);

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
    optionsError.value = '';
    try {
        const path = bookingOptions.url(props.identifier);
        const j = await fetchPublicJson(path);
        if (j && typeof j === 'object' && 'data' in j && (j as { data: unknown }).data) {
            const d = (j as { data: BookingOptionsPayload }).data;
            bookingOptionsData.value = d;
            initTicketQuantities(d.ticket_types);
        } else {
            bookingOptionsData.value = null;
            optionsError.value = t('publicBooking.loadOptionsError');
        }
    } catch {
        bookingOptionsData.value = null;
        optionsError.value = t('publicBooking.loadOptionsError');
    }
}

async function load(): Promise<void> {
    isLoading.value = true;
    errorMessage.value = '';
    optionsError.value = '';
    program.value = null;
    bookingOptionsData.value = null;
    createdBooking.value = null;
    step.value = 1;
    tripStepResetKey.value += 1;
    selectedTripId.value = '';
    step2Error.value = '';
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
        } else if (program.value !== null) {
            optionsError.value = t('publicBooking.loadOptionsError');
        }
    } else if (program.value !== null) {
        optionsError.value = t('publicBooking.loadOptionsError');
    }

    isLoading.value = false;
}

function goToTicketsStep(): void {
    step2Error.value = '';
    if (selectedTripId.value.trim().length === 0) {
        step2Error.value = t('publicBooking.selectTripFirst');
        return;
    }
    step.value = 2;
}

function countTotalSelectedTickets(): number {
    let n = 0;
    for (const tt of ticketTypeOptions.value) {
        const raw = ticketQuantities.value[String(tt.id)];
        const q = typeof raw === 'number' && !Number.isNaN(raw) ? Math.max(0, Math.floor(raw)) : 0;
        n += q;
    }
    return n;
}

function goToContactStep(): void {
    step2Error.value = '';
    submitError.value = '';

    const trip = selectedTrip.value;
    if (trip === undefined) {
        step2Error.value = t('publicBooking.selectTripFirst');
        return;
    }

    let anySelected = false;
    for (const tt of ticketTypeOptions.value) {
        const raw = ticketQuantities.value[String(tt.id)];
        const q = typeof raw === 'number' && !Number.isNaN(raw) ? Math.max(0, Math.floor(raw)) : 0;
        if (q > 0) {
            anySelected = true;
            if (q < tt.min_per_purchase) {
                step2Error.value = t('publicBooking.minPerType', { min: String(tt.min_per_purchase) });
                return;
            }
            if (tt.max_per_purchase !== null && q > tt.max_per_purchase) {
                step2Error.value = t('publicBooking.maxPerType', { max: String(tt.max_per_purchase) });
                return;
            }
        }
    }

    if (!anySelected) {
        step2Error.value = t('publicBooking.selectAtLeastOneTicket');
        return;
    }

    const total = countTotalSelectedTickets();
    if (total > trip.remaining_capacity) {
        step2Error.value = t('publicBooking.totalExceedsTrip');
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

    const payload = {
        trip_id: String(trip.id),
        ticket_quantities: quantities,
        contact_name: String(values.contact_name).trim(),
        contact_email: String(values.contact_email).trim(),
    };

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
    step2Error.value = '';
    submitError.value = '';
    resetForm();
    if (bookingOptionsData.value !== null) {
        initTicketQuantities(bookingOptionsData.value.ticket_types);
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
</script>

<style scoped>

.program-surface {
    background: #ffffff;
    border: 1px solid hsla(226, 97%, 12%, 0.12);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 14px 28px hsla(226, 97%, 12%, 0.08);
}

.program-description {
    white-space: pre-wrap;
}
</style>
