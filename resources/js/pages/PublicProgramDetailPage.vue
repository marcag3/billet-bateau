<template>
    <q-page class="q-pa-md q-pa-sm-md public-program-page" padding>
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
                        <div v-if="tripOptions.length === 0" class="text-body1 text-grey-8">
                            {{ t('publicBooking.noTrips') }}
                        </div>
                        <q-list v-else bordered separator class="rounded-borders">
                            <q-item
                                v-for="trip in tripOptions"
                                :key="String(trip.id)"
                                v-ripple
                                tag="label"
                                clickable
                                :active="String(selectedTripId) === String(trip.id)"
                                active-class="bg-blue-1"
                            >
                                <q-item-section side top class="q-pt-sm">
                                    <q-radio v-model="selectedTripId" :val="String(trip.id)" />
                                </q-item-section>
                                <q-item-section
                                    v-if="
                                        trip.product_banner_url != null &&
                                        trip.product_banner_url.length > 0
                                    "
                                    avatar
                                    top
                                >
                                    <q-avatar rounded size="40px">
                                        <q-img
                                            :src="trip.product_banner_url"
                                            ratio="1"
                                            fit="cover"
                                            :alt="trip.product_name"
                                        />
                                    </q-avatar>
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label class="text-body1">{{
                                        formatTripOptionLabel(trip)
                                    }}</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-list>
                        <div class="row q-gutter-sm q-mt-md justify-end">
                            <q-btn
                                color="primary"
                                no-caps
                                :label="t('publicBooking.continue')"
                                :disable="!canContinueFromTripStep"
                                @click="goToTicketsStep"
                            />
                        </div>
                    </q-step>

                    <q-step :name="2" :title="t('publicBooking.stepTickets')" :done="step > 2">
                        <div v-if="ticketTypeOptions.length === 0" class="text-body1 text-grey-8">
                            {{ t('publicBooking.noTicketTypes') }}
                        </div>
                        <div v-else class="column q-gutter-md">
                            <div
                                v-for="tt in ticketTypeOptions"
                                :key="`tt-${String(tt.id)}`"
                                class="row items-center q-col-gutter-sm"
                            >
                                <div class="col-12 col-sm-6">
                                    <div class="text-subtitle1 text-weight-medium">{{ tt.title }}</div>
                                    <div class="text-caption text-grey-7">{{ formatTicketTypePrice(tt) }}</div>
                                </div>
                                <div class="col-12 col-sm-4">
                                    <q-input
                                        v-model.number="ticketQuantities[String(tt.id)]"
                                        type="number"
                                        outlined
                                        dense
                                        :min="0"
                                        :label="t('publicBooking.ticketQuantityLabel', { title: tt.title })"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="row q-gutter-sm q-mt-md justify-between">
                            <q-btn flat no-caps color="primary" :label="t('publicBooking.back')" @click="step = 1" />
                            <q-btn
                                color="primary"
                                no-caps
                                :label="t('publicBooking.continue')"
                                :disable="ticketTypeOptions.length === 0"
                                @click="goToContactStep"
                            />
                        </div>
                    </q-step>

                    <q-step :name="3" :title="t('publicBooking.stepContact')">
                        <q-form class="column q-gutter-md" @submit="onContactSubmit">
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
                                <q-btn flat no-caps color="primary" :label="t('publicBooking.back')" @click="step = 2" />
                                <q-btn
                                    color="primary"
                                    no-caps
                                    type="submit"
                                    :label="t('publicBooking.submitBook')"
                                    :loading="isSubmitting"
                                    :disable="!meta.valid || isSubmitting"
                                />
                            </div>
                        </q-form>
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

const props = defineProps<{
    identifier: string;
}>();

type PublicProgram = {
    id?: string;
    name?: string;
    description?: string;
    banner_url?: string | null;
};

type BookingTripOption = {
    id: string;
    scheduled_departure_at: string;
    capacity: number;
    remaining_capacity: number;
    product_id: string;
    product_name: string;
    product_description: string | null;
    product_banner_url: string | null;
    boat_type_name: string | null;
    water_route_name: string | null;
    water_route_duration_minutes: number | null;
};

type BookingTicketTypeOption = {
    id: string;
    title: string;
    price_cents: number | null;
    is_pay_what_you_can: boolean;
    min_per_purchase: number;
    max_per_purchase: number | null;
};

type BookingOptionsPayload = {
    trips: BookingTripOption[];
    ticket_types: BookingTicketTypeOption[];
};

type CreatedBookingPayload = {
    id: string;
    trip_id: string;
    total_tickets: number;
    contact_name: string;
    contact_email: string;
};

const { t, locale } = useI18n();

const isLoading = ref(true);
const errorMessage = ref('');
const program = ref<PublicProgram | null>(null);

const optionsError = ref('');
const bookingOptionsData = ref<BookingOptionsPayload | null>(null);

const step = ref(1);
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

const canContinueFromTripStep = computed(() => selectedTripId.value.trim().length > 0);

function formatTripOptionLabel(trip: BookingTripOption): string {
    const when = formatDeparture(trip.scheduled_departure_at);
    const seats = t('publicBooking.remainingSeats', { count: String(trip.remaining_capacity) });
    const boat = trip.boat_type_name != null && trip.boat_type_name.length > 0 ? trip.boat_type_name : '—';
    const route =
        trip.water_route_name != null && trip.water_route_name.length > 0 ? trip.water_route_name : '—';
    const meta = t('publicBooking.tripProductMeta', {
        boat,
        route,
        capacity: String(trip.capacity),
    });
    return `${when} — ${trip.product_name} — ${meta} — ${seats}`;
}

function formatDeparture(iso: string): string {
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat(String(locale.value), {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(d);
    } catch {
        return iso;
    }
}

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
    selectedTripId.value = '';
    step2Error.value = '';
    submitError.value = '';
    resetForm();

    const programPath = '/api/public/programs/' + encodeURIComponent(props.identifier);

    const [pRes, oRes] = await Promise.allSettled([
        fetchPublicJson(programPath),
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
    if (!canContinueFromTripStep.value) {
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
</script>

<style scoped>
.public-program-page {
    padding-top: 2rem;
}

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
