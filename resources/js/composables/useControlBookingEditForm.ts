import { useForm } from 'vee-validate';
import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import {
    createBookingEditFormSchema,
    type BookingEditFormValues,
} from '../models/bookings/bookings.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { DEFAULT_COUNTRY_CODE } from './useCountryOptions';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { liveQueryRows } from '../powersync/live-query-casts';
import type { BookingOutput } from '../powersync/bookings.collection';
import type { BookingTicketOutput } from '../powersync/booking-tickets.collection';
import type { PassengerOutput } from '../powersync/passengers.collection';
import { useBookingAdminCrud, isBookingCancelled } from './useBookingAdminCrud';
import { useProgramTripSelectOptions } from './useProgramTripSelectOptions';
import { useControlPanelUndoCheckIn } from './useControlPanelUndoCheckIn';
import { useConfirmDialog } from './useConfirmDialog';
import { useNotifyAsyncAction } from './useNotifyAsyncAction';
import { useNotifyErrorFromCatch } from './useNotifyErrorFromCatch';
import {
    formatTripSelectCapacitySuffix,
    tripHasCapacityForBookingMove,
} from '../utilities/booking-admin-validation';
import {
    customAnswersFromFieldMap,
    parseBookingTicketCustomFields,
    parseProgramBookingQuestions,
    validateBookingCustomAnswers,
} from '../utilities/program-booking-questions';
import {
    formatDepartureParts,
} from '../utilities/program-timezone-datetime';
import type { TripWithRelationsRow } from '../powersync/joined-queries';

/**
 * Control-panel booking edit state: booking/ticket/check-in live queries, vee-validate
 * booking form, trip move capacity checks, and booking/ticket CRUD actions.
 */
export function useControlBookingEditForm(
    bookingIdSource: MaybeRefOrGetter<string>,
    onDeleted: () => void,
) {
    const powersync = getAppPowerSyncContext();
    const { t, locale } = useI18n();
    const $q = useQuasar();
    const { confirm } = useConfirmDialog();
    const { notifyError } = useNotifyErrorFromCatch();
    const { runWithNotify } = useNotifyAsyncAction();
    const {
        updateBooking,
        cancelBooking,
        deleteBooking,
        insertBookingTicket,
        updateBookingTicket,
        removeBookingTicket,
    } = useBookingAdminCrud();
    const { undoCheckInForBooking } = useControlPanelUndoCheckIn();

    const isDeleting = ref(false);
    const isCancelling = ref(false);
    const isRestoring = ref(false);
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

    const bookingId = computed(() => String(toValue(bookingIdSource) ?? '').trim());

    const schema = createBookingEditFormSchema(t);
    const { handleSubmit, defineField, meta, isSubmitting, resetForm, validate } =
        useForm<BookingEditFormValues>({
            validationSchema: schema,
            initialValues: {
                tripId: '',
                contact_name: '',
                contact_email: '',
                contact_phone: '',
            },
        });

    const quasarField = createQuasarFieldBinder(defineField);
    const [tripId, tripIdProps] = quasarField('tripId');
    const [contactName, contactNameProps] = quasarField('contact_name');
    const [contactEmail, contactEmailProps] = quasarField('contact_email');
    const [contactPhone, contactPhoneProps] = quasarField('contact_phone');

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

    const { tripRows, programTimezone } = useProgramTripSelectOptions({
        onlyScheduledOrBoardingTrips: true,
        alwaysIncludeTripIds: computed(() => {
            const id = String(currentBooking.value?.trip_id ?? '').trim();
            return id.length > 0 ? [id] : [];
        }),
    });

    const isCancelled = computed(() => isBookingCancelled(currentBooking.value?.deleted_at));

    const isCancelledByTrip = computed(() => {
        const voyageId = String(currentBooking.value?.cancelled_by_voyage_id ?? '').trim();
        return isCancelled.value && voyageId.length > 0;
    });

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

    const canRestoreBooking = computed(
        () =>
            isCancelled.value &&
            !isCancelledByTrip.value &&
            !tripChanged.value &&
            hasCapacityForSelectedTrip.value &&
            !isSubmitting.value &&
            !isDeleting.value &&
            !isRestoring.value,
    );

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
                    contact_phone: String(booking.contact_phone ?? ''),
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

    const canCancelBooking = computed(
        () =>
            tickets.value.length > 0 &&
            !hasCheckIn.value &&
            !isCancelled.value &&
            !isSubmitting.value &&
            !isDeleting.value &&
            !isCancelling.value &&
            !isRestoring.value,
    );

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
                    contactPhone: values.contact_phone,
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

    function confirmRestoreBooking(): void {
        confirm({
            title: t('programsControlAdmin.restoreBookingConfirmTitle'),
            message: t('programsControlAdmin.restoreBookingConfirmMessage'),
            onOk: async () => {
                isRestoring.value = true;
                try {
                    await runWithNotify(
                        async () => {
                            await updateBooking(bookingId.value, { deletedAt: null });
                        },
                        {
                            successMessage: t('programsControlAdmin.bookingRestored'),
                            errorGeneric: t('programsControl.errorGeneric'),
                        },
                    );
                } finally {
                    isRestoring.value = false;
                }
            },
        });
    }

    function confirmCancelBooking(): void {
        confirm({
            title: t('programsControlAdmin.cancelBookingTitle'),
            message: t('programsControlAdmin.cancelBookingMessage'),
            onOk: async () => {
                isCancelling.value = true;
                try {
                    await runWithNotify(
                        async () => {
                            await cancelBooking(bookingId.value);
                        },
                        {
                            successMessage: t('programsControl.bookingCancelled'),
                            errorGeneric: t('programsControl.errorGeneric'),
                        },
                    );
                } finally {
                    isCancelling.value = false;
                }
            },
        });
    }

    function confirmDeleteBooking(): void {
        confirm({
            title: t('programsControlAdmin.deleteBookingTitle'),
            message: t('programsControlAdmin.deleteBookingMessage'),
            onOk: async () => {
                isDeleting.value = true;
                try {
                    await deleteBooking(bookingId.value);
                    $q.notify({ type: 'positive', message: t('programsControlAdmin.bookingDeleted') });
                    onDeleted();
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

    return {
        t,
        currentBooking,
        showNotFound,
        isCancelled,
        isCancelledByTrip,
        canRestoreBooking,
        isRestoring,
        confirmRestoreBooking,
        tripId,
        tripIdProps,
        tripOptions,
        contactName,
        contactNameProps,
        contactEmail,
        contactEmailProps,
        contactPhone,
        contactPhoneProps,
        bookingQuestions,
        customAnswers,
        customAnswerErrors,
        isSubmitting,
        isDeleting,
        isCancelling,
        hasCheckIn,
        canSaveBooking,
        canCancelBooking,
        canDeleteBooking,
        onSaveSubmit,
        confirmCancelBooking,
        confirmDeleteBooking,
        tickets,
        openEditTicket,
        confirmDeleteTicket,
        newTicketTypeId,
        newTicketName,
        newTicketEmail,
        newTicketCountry,
        ticketTypeOptions,
        canAddTicket,
        onAddTicketSubmit,
        onUndoCheckIn,
        editTicketDialogOpen,
        editTicketTypeId,
        editTicketName,
        editTicketEmail,
        editTicketCountry,
        onSaveTicketEdit,
    };
}
