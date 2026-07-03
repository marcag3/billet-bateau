<template>
    <q-banner v-if="showNotFound" class="bg-warning text-dark mb-4" rounded>
        {{ t('programsControlAdmin.bookingNotFound') }}
    </q-banner>

    <template v-else-if="currentBooking">
        <q-banner v-if="isCancelled" class="bg-negative text-white mb-4" rounded>
            {{ t('programsControlAdmin.bookingCancelledBanner') }}
        </q-banner>

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
                    <AppBookingCustomQuestionsFields
                        v-if="bookingQuestions.length > 0"
                        v-model:answers="customAnswers"
                        :questions="bookingQuestions"
                        :errors="customAnswerErrors"
                        :disabled="isSubmitting || isDeleting"
                    />
                    <div class="row gap-2">
                        <q-btn
                            color="primary"
                            type="submit"
                            :label="t('programsControlAdmin.saveBooking')"
                            :loading="isSubmitting"
                            :disable="!canSaveBooking"
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

            <q-form v-if="!hasCheckIn && !isCancelled" @submit.prevent="onAddTicketSubmit">
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
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import {
    createBookingEditFormSchema,
    type BookingEditFormValues,
} from '../../models/bookings/bookings.validation';
import { createQuasarFieldBinder } from '../../validation/quasar-vee-fields';
import { DEFAULT_COUNTRY_CODE } from '../../composables/useCountryOptions';
import { getAppPowerSyncContext } from '../../powersync/app-powersync.runtime';
import { liveQueryRows } from '../../powersync/live-query-casts';
import type { BookingOutput } from '../../powersync/bookings.collection';
import type { BookingTicketOutput } from '../../powersync/booking-tickets.collection';
import type { PassengerOutput } from '../../powersync/passengers.collection';
import { useBookingAdminCrud, isBookingCancelled } from '../../composables/useBookingAdminCrud';
import { useProgramTripSelectOptions } from '../../composables/useProgramTripSelectOptions';
import { useControlPanelUndoCheckIn } from '../../composables/useControlPanelUndoCheckIn';
import { useConfirmDialog } from '../../composables/useConfirmDialog';
import { useNotifyAsyncAction } from '../../composables/useNotifyAsyncAction';
import { useNotifyErrorFromCatch } from '../../composables/useNotifyErrorFromCatch';
import {
    formatTripSelectCapacitySuffix,
    tripHasCapacityForBookingMove,
} from '../../utilities/booking-admin-validation';
import {
    customAnswersFromFieldMap,
    parseBookingTicketCustomFields,
    parseProgramBookingQuestions,
    validateBookingCustomAnswers,
} from '../../utilities/program-booking-questions';
import {
    formatDepartureParts,
    resolveProgramTimezone,
} from '../../utilities/program-timezone-datetime';
import type { TripWithRelationsRow } from '../../powersync/joined-queries';
import AppCardSection from '../ui/AppCardSection.vue';
import AppEmptyListRow from '../ui/AppEmptyListRow.vue';
import AppCountrySelect from '../molecules/AppCountrySelect.vue';
import AppBookingCustomQuestionsFields from '../molecules/AppBookingCustomQuestionsFields.vue';

const props = defineProps<{
    bookingId: string;
}>();

const emit = defineEmits<{
    deleted: [];
}>();

const powersync = getAppPowerSyncContext();
const { t, locale } = useI18n();
const $q = useQuasar();
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
const customAnswers = ref<string[]>([]);
const customAnswerErrors = ref<Record<number, string>>({});

const editTicketDialogOpen = ref(false);
const editingTicketId = ref('');
const editTicketTypeId = ref('');
const editTicketName = ref('');
const editTicketEmail = ref('');
const editTicketCountry = ref(DEFAULT_COUNTRY_CODE);

const bookingId = computed(() => String(props.bookingId ?? '').trim());

const { tripRows, programTimezone } = useProgramTripSelectOptions();

const schema = createBookingEditFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm, validate } =
    useForm<BookingEditFormValues>({
        validationSchema: schema,
        initialValues: {
            tripId: '',
            contact_name: '',
            contact_email: '',
        },
    });

const quasarField = createQuasarFieldBinder(defineField);
const [tripId, tripIdProps] = quasarField('tripId');
const [contactName, contactNameProps] = quasarField('contact_name');
const [contactEmail, contactEmailProps] = quasarField('contact_email');

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

const isCancelled = computed(() => isBookingCancelled(currentBooking.value?.deleted_at));

const showNotFound = computed(
    () => bookingId.value.length > 0 && bookingRaw.value != null && currentBooking.value == null,
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

const { data: activeTicketsRaw } = useLiveQuery(
    (qb) => {
        const ticketsCol = powersync.collections.booking_tickets.value;
        const bookingsCol = powersync.collections.bookings.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!ticketsCol || !bookingsCol || pid.length === 0) {
            return undefined;
        }
        return qb
            .from({ bt: ticketsCol })
            .innerJoin({ b: bookingsCol }, ({ bt, b }) => eq(bt.booking_id, b.id))
            .where(({ b }) => eq(b.program_id, pid))
            .fn.where((row) => {
                const deletedAt = (row.b as { deleted_at?: string | null }).deleted_at;
                return deletedAt == null || String(deletedAt).trim() === '';
            })
            .select(({ bt, b }) => ({
                trip_id: b.trip_id,
                ticket_id: bt.id,
            }));
    },
    [
        powersync.collections.booking_tickets,
        powersync.collections.bookings,
        powersync.activeProgramIdRef,
    ],
);

const activeTicketCountByTripId = computed(() => {
    const map = new Map<string, number>();
    for (const row of liveQueryRows<{ trip_id: string | null }>(activeTicketsRaw.value)) {
        const tripIdValue = String(row.trip_id ?? '').trim();
        if (tripIdValue.length === 0) {
            continue;
        }
        map.set(tripIdValue, (map.get(tripIdValue) ?? 0) + 1);
    }
    return map;
});

function formatTripSelectLabel(trip: TripWithRelationsRow): string {
    const product = String(trip.product_name ?? '—');
    const dep = trip.scheduled_departure_at;
    if (dep == null || String(dep).trim() === '') {
        return `— · ${product}`;
    }

    const { date, time } = formatDepartureParts(
        String(dep),
        programTimezone.value,
        String(locale.value),
    );

    return `${date} ${time} · ${product}`;
}

const tripChanged = computed(
    () =>
        String(tripId.value ?? '').trim() !==
        String(currentBooking.value?.trip_id ?? '').trim(),
);

const selectedTrip = computed(
    () =>
        tripRows.value.find(
            (trip) => String(trip.id) === String(tripId.value ?? '').trim(),
        ) ?? null,
);

const hasCapacityForSelectedTrip = computed(() => {
    const trip = selectedTrip.value;
    const selectedTripId = String(tripId.value ?? '').trim();

    if (trip == null) {
        return selectedTripId.length === 0;
    }

    const tripIdValue = String(trip.id);
    const activeCount = activeTicketCountByTripId.value.get(tripIdValue) ?? 0;

    return tripHasCapacityForBookingMove({
        tripCapacity: trip.capacity,
        activeBookedTicketCount: activeCount,
        bookingTicketCount: tickets.value.length,
    });
});

const canSaveBooking = computed(() => {
    if (!meta.value.valid || isSubmitting.value || isDeleting.value) {
        return false;
    }

    if (isCancelled.value) {
        return tripChanged.value && hasCapacityForSelectedTrip.value;
    }

    if (tripChanged.value && !hasCapacityForSelectedTrip.value) {
        return false;
    }

    return true;
});

const tripOptions = computed(() => {
    const currentTripId = String(currentBooking.value?.trip_id ?? '').trim();
    const ticketCount = tickets.value.length;
    const tz = programTimezone.value;
    const loc = String(locale.value);

    return tripRows.value.map((trip) => {
        const tripIdValue = String(trip.id);
        const activeCount = activeTicketCountByTripId.value.get(tripIdValue) ?? 0;
        const hasCapacity = tripHasCapacityForBookingMove({
            tripCapacity: trip.capacity,
            activeBookedTicketCount: activeCount,
            bookingTicketCount: ticketCount,
        });
        const remaining = Math.max(
            0,
            Math.floor(Number(trip.capacity) || 0) - activeCount,
        );
        const baseLabel = formatTripSelectLabel(trip);
        const suffix = formatTripSelectCapacitySuffix(remaining, trip.capacity, t);
        const label = suffix.length > 0 ? `${baseLabel} ${suffix}` : baseLabel;

        return {
            value: tripIdValue,
            label,
            disable: !hasCapacity && tripIdValue !== currentTripId,
        };
    });
});

const seededBookingId = ref('');

watch(bookingId, () => {
    seededBookingId.value = '';
});

watch(
    [bookingId, currentBooking, bookingQuestions],
    async ([id, booking, questions]) => {
        if (id.length === 0 || booking == null || String(booking.id) !== id) {
            return;
        }

        if (seededBookingId.value === id) {
            return;
        }

        seededBookingId.value = id;

        const ticketRows = tickets.value;
        const firstTicket = ticketRows[0];
        const fieldMap =
            firstTicket != null
                ? parseBookingTicketCustomFields(firstTicket.custom_fields)
                : {};

        resetForm({
            values: {
                tripId: String(booking.trip_id ?? ''),
                contact_name: String(booking.contact_name ?? ''),
                contact_email: String(booking.contact_email ?? ''),
            },
        });
        customAnswers.value = customAnswersFromFieldMap(questions, fieldMap);
        customAnswerErrors.value = {};
        newTicketName.value = String(booking.contact_name ?? '');
        newTicketEmail.value = String(booking.contact_email ?? '');
        await validate();
    },
    { immediate: true },
);

watch(
    () => tickets.value.length,
    (ticketCount, previousCount) => {
        if (seededBookingId.value.length === 0 || ticketCount === 0) {
            return;
        }

        if (previousCount !== 0 || bookingQuestions.value.length === 0) {
            return;
        }

        const firstTicket = tickets.value[0];
        if (firstTicket == null) {
            return;
        }

        const fieldMap = parseBookingTicketCustomFields(firstTicket.custom_fields);
        const hasStoredAnswers = Object.values(fieldMap).some(
            (answer) => String(answer).trim().length > 0,
        );
        const answersEmpty = customAnswers.value.every(
            (answer) => String(answer).trim().length === 0,
        );

        if (hasStoredAnswers && answersEmpty) {
            customAnswers.value = customAnswersFromFieldMap(
                bookingQuestions.value,
                fieldMap,
            );
        }
    },
);

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

function resolveCustomFieldMapForSave(): Record<string, string> | null {
    const validation = validateBookingCustomAnswers({
        questions: bookingQuestions.value,
        answers: customAnswers.value,
        t,
    });
    customAnswerErrors.value = validation.errors;

    return validation.customFieldMap;
}

const onSaveSubmit = handleSubmit(async (values: BookingEditFormValues) => {
    const customFieldMap = resolveCustomFieldMapForSave();
    if (customFieldMap === null) {
        return;
    }

    if (!hasCapacityForSelectedTrip.value) {
        $q.notify({ type: 'negative', message: t('programsControl.capacityFull') });
        return;
    }

    await runWithNotify(
        async () => {
            const restoreCancelled = isCancelled.value && tripChanged.value;

            await updateBooking(bookingId.value, {
                tripId: values.tripId,
                contactName: values.contact_name,
                contactEmail: values.contact_email,
                ...(restoreCancelled ? { deletedAt: null } : {}),
            });

            if (bookingQuestions.value.length > 0) {
                for (const ticket of tickets.value) {
                    await updateBookingTicket(String(ticket.id), {
                        customFieldMap,
                    });
                }
            }
        },
        {
            successMessage: isCancelled.value
                ? t('programsControlAdmin.bookingRebooked')
                : t('programsControlAdmin.bookingSaved'),
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
                emit('deleted');
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

    const customFieldMap = resolveCustomFieldMapForSave();
    if (customFieldMap === null) {
        return;
    }

    await runWithNotify(
        async () => {
            await insertBookingTicket(bookingId.value, {
                ticketTypeId: newTicketTypeId.value,
                name: newTicketName.value,
                email: newTicketEmail.value,
                country: newTicketCountry.value,
                customFieldMap,
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
