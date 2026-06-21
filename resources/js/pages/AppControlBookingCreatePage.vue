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
                        :label="t('publicBooking.contactEmail')"
                        :disable="isSubmitting"
                    />
                    <AppCountrySelect
                        v-model="country"
                        v-bind="countryProps"
                        :label="t('publicBooking.country')"
                        :disable="isSubmitting"
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
                        :disable="!meta.valid || isSubmitting || programId.length === 0 || !ticketTypeId"
                        class="self-start"
                    />
                </div>
            </q-form>
        </AppCardSection>
    </AppEntityCreatePageLayout>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { computed, ref } from 'vue';
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
import { joinTripsWithRelationsFrom } from '../powersync/joined-queries';
import { liveQueryRows } from '../powersync/live-query-casts';
import { useBookingAdminCrud } from '../composables/useBookingAdminCrud';
import { useNotifyAsyncAction } from '../composables/useNotifyAsyncAction';
import { controlContextNamedRoute } from '../utilities/control-context-route';
import AppEntityCreatePageLayout from '../layouts/AppEntityCreatePageLayout.vue';
import AppCardSection from '../components/ui/AppCardSection.vue';
import AppCountrySelect from '../components/molecules/AppCountrySelect.vue';

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { addWalkInBooking } = useBookingAdminCrud();
const { runWithNotify } = useNotifyAsyncAction();

const ticketTypeId = ref('');

const programId = computed(() => String(route.params.programId ?? '').trim());
const activeProgramIdRef = powersync.activeProgramIdRef;

const backTo = computed(() => controlContextNamedRoute(route, 'control.bookings.list'));

const schema = createBookingAdminFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting } = useForm<BookingAdminFormValues>({
    validationSchema: schema,
    initialValues: {
        tripId: '',
        contact_name: '',
        contact_email: '',
        country: DEFAULT_COUNTRY_CODE,
    },
});

const quasarField = createQuasarFieldBinder(defineField);
const [tripId, tripIdProps] = quasarField('tripId');
const [contactName, contactNameProps] = quasarField('contact_name');
const [contactEmail, contactEmailProps] = quasarField('contact_email');
const [country, countryProps] = quasarField('country');

const { data: tripsRaw } = useLiveQuery(
    (qb) => {
        const tripsCol = powersync.collections.trips.value;
        const productsCol = powersync.collections.products.value;
        const boatTypesCol = powersync.collections.boat_types.value;
        const waterRoutesCol = powersync.collections.water_routes.value;
        const pid = activeProgramIdRef.value.trim();
        if (!tripsCol || !productsCol || !boatTypesCol || !waterRoutesCol || pid.length === 0) {
            return undefined;
        }
        return joinTripsWithRelationsFrom(
            qb,
            tripsCol,
            productsCol,
            boatTypesCol,
            waterRoutesCol,
        )
            .where(({ trip }) => eq(trip.program_id, pid))
            .orderBy(({ trip }) => trip.scheduled_departure_at, 'asc');
    },
    [
        powersync.collections.trips,
        powersync.collections.products,
        powersync.collections.boat_types,
        powersync.collections.water_routes,
        activeProgramIdRef,
    ],
);

const tripOptions = computed(() =>
    liveQueryRows<{ id: string; product_name: string | null; scheduled_departure_at: string | null }>(
        tripsRaw.value,
    ).map((trip) => ({
        value: String(trip.id),
        label: `${String(trip.scheduled_departure_at ?? '—')} · ${String(trip.product_name ?? '—')}`,
    })),
);

const { data: ticketTypesRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.ticket_types.value;
        const pid = activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return qb.from({ tt: col }).where(({ tt }) => eq(tt.program_id, pid));
    },
    [powersync.collections.ticket_types, activeProgramIdRef],
);

const ticketTypeOptions = computed(() =>
    liveQueryRows<{ id: string; title: string | null }>(ticketTypesRaw.value).map((tt) => ({
        value: String(tt.id),
        label: String(tt.title ?? '—'),
    })),
);

const onCreateSubmit = handleSubmit(async (values: BookingAdminFormValues) => {
    await runWithNotify(
        async () => {
            const result = await addWalkInBooking({
                programId: programId.value,
                tripId: values.tripId,
                ticketQuantities: { [ticketTypeId.value]: 1 },
                contactName: values.contact_name,
                contactEmail: values.contact_email,
                country: values.country,
                customFieldMap: {},
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
