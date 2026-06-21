<template>
    <AppEntityEditPageLayout
        :title="t('programsControlAdmin.editBookingTitle')"
        :back-to="backTo"
        :back-label="t('programsControlAdmin.backToBookings')"
    >
        <q-banner v-if="showNotFound" class="bg-warning text-dark mb-4" rounded>
            {{ t('programsControlAdmin.bookingNotFound') }}
            <template #action>
                <q-btn color="primary" flat :label="t('programsControlAdmin.backToBookings')" :to="backTo" />
            </template>
        </q-banner>

        <template v-else-if="currentBooking">
            <AppCardSection :label="t('programsControlAdmin.bookingDetails')">
                <q-form @submit.prevent="onSaveSubmit">
                    <div class="column gap-4">
                        <q-select
                            v-model="tripId"
                            v-bind="tripIdProps"
                            outlined
                            emit-value
                            map-options
                            :options="tripOptions"
                            :label="t('programsControlAdmin.trip')"
                            :disable="isSubmitting || isDeleting || hasCheckIn"
                        />
                        <q-input
                            v-model="contactName"
                            v-bind="contactNameProps"
                            outlined
                            :label="t('publicBooking.contactName')"
                            :disable="isSubmitting || isDeleting"
                        />
                        <q-input
                            v-model="contactEmail"
                            v-bind="contactEmailProps"
                            outlined
                            type="email"
                            :label="t('publicBooking.contactEmail')"
                            :disable="isSubmitting || isDeleting"
                        />
                        <div class="row gap-2">
                            <q-btn
                                color="primary"
                                type="submit"
                                :label="t('programsControlAdmin.saveBooking')"
                                :loading="isSubmitting"
                                :disable="!meta.valid || isSubmitting || isDeleting"
                            />
                            <q-btn
                                v-if="canDeleteBooking"
                                flat
                                color="negative"
                                icon="delete"
                                :label="t('common.delete')"
                                :disable="isSubmitting || isDeleting"
                                @click="confirmDeleteBooking"
                            />
                        </div>
                    </div>
                </q-form>
            </AppCardSection>

            <AppCardSection :label="t('programsControlAdmin.ticketsSection')">
                <AppEmptyListRow
                    :show="tickets.length === 0"
                    :message="t('programsControlAdmin.noTickets')"
                />
                <q-list v-if="tickets.length > 0" separator class="q-mb-md">
                    <q-item v-for="ticket in tickets" :key="String(ticket.id)">
                        <q-item-section>
                            <q-item-label>{{ ticket.name ?? '—' }}</q-item-label>
                            <q-item-label caption>{{ ticket.email ?? '—' }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <div class="row gap-1">
                                <q-btn
                                    flat
                                    dense
                                    color="primary"
                                    :label="t('common.edit')"
                                    @click="() => openEditTicket(ticket)"
                                />
                                <q-btn
                                    flat
                                    dense
                                    color="negative"
                                    icon="delete"
                                    :disable="hasCheckIn"
                                    @click="() => confirmDeleteTicket(ticket)"
                                />
                            </div>
                        </q-item-section>
                    </q-item>
                </q-list>

                <q-form v-if="!hasCheckIn" @submit.prevent="onAddTicketSubmit">
                    <div class="text-subtitle2 q-mb-sm">{{ t('programsControlAdmin.addTicket') }}</div>
                    <div class="column gap-4">
                        <q-select
                            v-model="newTicketTypeId"
                            outlined
                            emit-value
                            map-options
                            :options="ticketTypeOptions"
                            :label="t('programsControl.ticketType')"
                        />
                        <q-input
                            v-model="newTicketName"
                            outlined
                            :label="t('programsControl.passengerName')"
                        />
                        <q-input
                            v-model="newTicketEmail"
                            outlined
                            type="email"
                            :label="t('publicBooking.contactEmail')"
                        />
                        <AppCountrySelect
                            v-model="newTicketCountry"
                            :label="t('publicBooking.country')"
                        />
                        <q-btn
                            color="primary"
                            outline
                            type="submit"
                            :label="t('programsControlAdmin.addTicket')"
                            :disable="!canAddTicket"
                            class="self-start"
                        />
                    </div>
                </q-form>
            </AppCardSection>

            <AppCardSection :label="t('programsControlAdmin.checkInSection')">
                <div class="text-body2 q-mb-sm">
                    {{
                        hasCheckIn
                            ? t('programsControlAdmin.checkedIn')
                            : t('programsControlAdmin.notCheckedIn')
                    }}
                </div>
                <q-btn
                    v-if="hasCheckIn"
                    flat
                    color="primary"
                    :label="t('programsControl.undoCheckIn')"
                    @click="onUndoCheckIn"
                />
            </AppCardSection>
        </template>

        <q-dialog v-model="editTicketDialogOpen" persistent>
            <q-card style="min-width: 320px; max-width: 480px">
                <q-card-section class="text-h6">
                    {{ t('programsControlAdmin.editTicket') }}
                </q-card-section>
                <q-form @submit.prevent="onSaveTicketEdit">
                    <q-card-section class="column gap-4">
                        <q-select
                            v-model="editTicketTypeId"
                            outlined
                            emit-value
                            map-options
                            :options="ticketTypeOptions"
                            :label="t('programsControl.ticketType')"
                        />
                        <q-input
                            v-model="editTicketName"
                            outlined
                            :label="t('programsControl.passengerName')"
                        />
                        <q-input
                            v-model="editTicketEmail"
                            outlined
                            type="email"
                            :label="t('publicBooking.contactEmail')"
                        />
                        <AppCountrySelect
                            v-model="editTicketCountry"
                            :label="t('publicBooking.country')"
                        />
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn v-close-popup flat :label="t('common.cancel')" />
                        <q-btn color="primary" type="submit" :label="t('common.save')" />
                    </q-card-actions>
                </q-form>
            </q-card>
        </q-dialog>
    </AppEntityEditPageLayout>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
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
import type { BookingOutput } from '../powersync/bookings.collection';
import type { BookingTicketOutput } from '../powersync/booking-tickets.collection';
import type { PassengerOutput } from '../powersync/passengers.collection';
import { useBookingAdminCrud } from '../composables/useBookingAdminCrud';
import { useControlPanelUndoCheckIn } from '../composables/useControlPanelUndoCheckIn';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useNotifyAsyncAction } from '../composables/useNotifyAsyncAction';
import { useNotifyErrorFromCatch } from '../composables/useNotifyErrorFromCatch';
import { controlContextNamedRoute } from '../utilities/control-context-route';
import AppEntityEditPageLayout from '../layouts/AppEntityEditPageLayout.vue';
import AppCardSection from '../components/ui/AppCardSection.vue';
import AppEmptyListRow from '../components/ui/AppEmptyListRow.vue';
import AppCountrySelect from '../components/molecules/AppCountrySelect.vue';

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();
const { runWithNotify } = useNotifyAsyncAction();
const {
    updateBooking,
    deleteBooking,
    insertBookingTicket,
    updateBookingTicket,
    removeBookingTicket,
} = useBookingAdminCrud();
const { undoCheckInForBooking } = useControlPanelUndoCheckIn();

const isDeleting = ref(false);
const newTicketTypeId = ref('');
const newTicketName = ref('');
const newTicketEmail = ref('');
const newTicketCountry = ref(DEFAULT_COUNTRY_CODE);

const editTicketDialogOpen = ref(false);
const editingTicketId = ref('');
const editTicketTypeId = ref('');
const editTicketName = ref('');
const editTicketEmail = ref('');
const editTicketCountry = ref(DEFAULT_COUNTRY_CODE);

const programId = computed(() => String(route.params.programId ?? '').trim());
const bookingId = computed(() => String(route.params.bookingId ?? '').trim());
const activeProgramIdRef = powersync.activeProgramIdRef;

const backTo = computed(() => controlContextNamedRoute(route, 'control.bookings.list'));

const schema = createBookingAdminFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm } =
    useForm<BookingAdminFormValues>({
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

const { data: bookingRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.bookings.value;
        const id = bookingId.value.trim();
        if (!col || id.length === 0) {
            return undefined;
        }
        return qb.from({ b: col }).where(({ b }) => eq(b.id, id));
    },
    [powersync.collections.bookings, bookingId],
);

const currentBooking = computed(() => {
    const rows = liveQueryRows<BookingOutput>(bookingRaw.value);
    return rows[0] ?? null;
});

const showNotFound = computed(
    () => bookingId.value.length > 0 && bookingRaw.value != null && currentBooking.value == null,
);

watch(
    currentBooking,
    (booking) => {
        if (booking == null) {
            return;
        }
        resetForm({
            values: {
                tripId: String(booking.trip_id ?? ''),
                contact_name: String(booking.contact_name ?? ''),
                contact_email: String(booking.contact_email ?? ''),
                country: DEFAULT_COUNTRY_CODE,
            },
        });
        newTicketName.value = String(booking.contact_name ?? '');
        newTicketEmail.value = String(booking.contact_email ?? '');
    },
    { immediate: true },
);

const { data: ticketsRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.booking_tickets.value;
        const id = bookingId.value.trim();
        if (!col || id.length === 0) {
            return undefined;
        }
        return qb.from({ bt: col }).where(({ bt }) => eq(bt.booking_id, id));
    },
    [powersync.collections.booking_tickets, bookingId],
);

const tickets = computed(() => liveQueryRows<BookingTicketOutput>(ticketsRaw.value));

const { data: checkInsRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.check_ins.value;
        const id = bookingId.value.trim();
        if (!col || id.length === 0) {
            return undefined;
        }
        return qb.from({ ci: col }).where(({ ci }) => eq(ci.booking_id, id));
    },
    [powersync.collections.check_ins, bookingId],
);

const { data: passengersRaw } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.passengers.value;
        const id = bookingId.value.trim();
        if (!col || id.length === 0) {
            return undefined;
        }
        return qb.from({ p: col }).where(({ p }) => eq(p.booking_id, id));
    },
    [powersync.collections.passengers, bookingId],
);

const passengers = computed(() => liveQueryRows<PassengerOutput>(passengersRaw.value));

const hasCheckIn = computed(() => liveQueryRows(checkInsRaw.value).length > 0);

const canDeleteBooking = computed(() => tickets.value.length === 0 && !hasCheckIn.value);

const canAddTicket = computed(
    () =>
        newTicketTypeId.value.trim().length > 0 &&
        newTicketName.value.trim().length > 0 &&
        newTicketEmail.value.trim().length > 0 &&
        newTicketCountry.value.trim().length === 2,
);

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

const onSaveSubmit = handleSubmit(async (values: BookingAdminFormValues) => {
    await runWithNotify(
        async () => {
            await updateBooking(bookingId.value, {
                tripId: values.tripId,
                contactName: values.contact_name,
                contactEmail: values.contact_email,
            });
        },
        {
            successMessage: t('programsControlAdmin.bookingSaved'),
            errorGeneric: t('programsControl.errorGeneric'),
        },
    );
});

function confirmDeleteBooking(): void {
    confirm({
        title: t('programsControlAdmin.deleteBookingTitle'),
        message: t('programsControlAdmin.deleteBookingMessage'),
        onOk: async () => {
            isDeleting.value = true;
            try {
                await deleteBooking(bookingId.value);
                $q.notify({ type: 'positive', message: t('programsControlAdmin.bookingDeleted') });
                await router.push(backTo.value);
            } catch (error) {
                notifyError(error, t('programsControl.errorGeneric'));
            } finally {
                isDeleting.value = false;
            }
        },
    });
}

async function onAddTicketSubmit(): Promise<void> {
    if (!canAddTicket.value) {
        return;
    }
    await runWithNotify(
        async () => {
            await insertBookingTicket(bookingId.value, {
                ticketTypeId: newTicketTypeId.value,
                name: newTicketName.value,
                email: newTicketEmail.value,
                country: newTicketCountry.value,
                customFieldMap: {},
            });
            newTicketTypeId.value = '';
        },
        {
            successMessage: t('programsControlAdmin.ticketAdded'),
            errorGeneric: t('programsControl.errorGeneric'),
        },
    );
}

function openEditTicket(ticket: BookingTicketOutput): void {
    editingTicketId.value = String(ticket.id);
    editTicketTypeId.value = String(ticket.ticket_type_id ?? '');
    editTicketName.value = String(ticket.name ?? '');
    editTicketEmail.value = String(ticket.email ?? '');
    editTicketCountry.value = String(ticket.country ?? DEFAULT_COUNTRY_CODE);
    editTicketDialogOpen.value = true;
}

async function onSaveTicketEdit(): Promise<void> {
    await runWithNotify(
        async () => {
            await updateBookingTicket(editingTicketId.value, {
                ticketTypeId: editTicketTypeId.value,
                name: editTicketName.value,
                email: editTicketEmail.value,
                country: editTicketCountry.value,
            });
            editTicketDialogOpen.value = false;
        },
        {
            successMessage: t('programsControlAdmin.ticketSaved'),
            errorGeneric: t('programsControl.errorGeneric'),
        },
    );
}

function confirmDeleteTicket(ticket: BookingTicketOutput): void {
    confirm({
        title: t('programsControl.removeWalkIn'),
        message: t('programsControl.removeWalkInConfirm', {
            name: String(ticket.name ?? ''),
        }),
        onOk: () =>
            removeBookingTicket(
                String(ticket.id),
                bookingId.value,
                tickets.value.length,
            ),
    });
}

function onUndoCheckIn(): void {
    confirm({
        title: t('programsControl.undoCheckIn'),
        message: t('programsControl.undoCheckInConfirm', {
            name: String(contactName.value ?? ''),
        }),
        onOk: () => undoCheckInForBooking(bookingId.value, passengers.value),
    });
}
</script>
