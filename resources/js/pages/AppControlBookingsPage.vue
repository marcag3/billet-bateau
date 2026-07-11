<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader :title="t('programsControlAdmin.bookingsTitle')">
                <template #actions>
                    <q-btn
                        color="primary"
                        icon="add"
                        :label="t('programsControlAdmin.addBooking')"
                        :to="controlContextNamedRoute(route, 'control.bookings.create')"
                    />
                </template>
            </AppPageHeader>
        </template>

        <AppControlDayDateToolbar
            v-model:selected-date-ymd="selectedDateYmd"
            v-model:show-all-dates="showAllDates"
            @prev-day="goPrevDay"
            @next-day="goNextDay"
            @go-today="goToday"
        >
            <template #trailing>
                <q-toggle
                    v-model="showCancelledBookings"
                    dense
                    :label="t('programsControlAdmin.showCancelledBookings')"
                />
                <q-chip outline>
                    {{ t('programsControlAdmin.totalTickets') }}: {{ totalFilteredTickets }}
                </q-chip>
            </template>
        </AppControlDayDateToolbar>

        <AppControlAdminTable
            v-model:search="searchText"
            :rows="tableRows"
            :columns="tableColumns"
            :no-data-label="t('programsControlAdmin.bookingsEmpty')"
            :search-placeholder="t('programsControlAdmin.searchBookingsPlaceholder')"
            default-sort-column="departure"
            :row-class="bookingRowClass"
            @row-click="onBookingRowClick"
        >
            <template #filters>
                <q-select
                    :model-value="selectedCheckInStates"
                    dense
                    outlined
                    multiple
                    clearable
                    emit-value
                    map-options
                    :label="t('programsControlAdmin.filterByCheckIn')"
                    :options="checkInFilterOptions"
                    style="min-width: 220px"
                    @update:model-value="onCheckInFilterUpdate"
                />
            </template>

            <template #body-cell-contact_name="props">
                <q-td :props="props">
                    {{ props.row.contact_name ?? '—' }}
                </q-td>
            </template>

            <template #body-cell-contact_phone="props">
                <q-td :props="props">
                    {{ props.row.contact_phone ?? '—' }}
                </q-td>
            </template>

            <template #body-cell-checkIn="props">
                <q-td :props="props">
                    {{ props.row.isCheckedIn
                        ? t('programsControlAdmin.checkedIn')
                        : t('programsControlAdmin.notCheckedIn') }}
                </q-td>
            </template>

            <template
                v-for="question in bookingQuestions"
                :key="question"
                #[`body-cell-${questionColumnName(question)}`]="props"
            >
                <q-td :props="props">
                    {{ customAnswerLabel(props.row, question) }}
                </q-td>
            </template>

            <template #body-cell-actions="props">
                <q-td :props="props" class="text-right" @click.stop>
                    <q-btn
                        v-if="canCancelBooking(props.row)"
                        flat
                        dense
                        color="negative"
                        icon="cancel"
                        :label="t('common.cancel')"
                        @click="() => confirmCancelBooking(props.row)"
                    />
                </q-td>
            </template>

        </AppControlAdminTable>

        <AppControlBookingEditDialog
            v-model:open="bookingEditDialogOpen"
            :booking-id="bookingEditId"
        />
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useRoute } from 'vue-router';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import type { QTableProps } from 'quasar';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { liveQueryRows } from '../powersync/live-query-casts';
import { isBookingCancelled, useBookingAdminCrud } from '../composables/useBookingAdminCrud';
import { useConfirmDialog } from '../composables/useConfirmDialog';
import { useNotifyErrorFromCatch } from '../composables/useNotifyErrorFromCatch';
import { tripDepartureMatchesLocalDateYmd } from '../powersync/control-panel-queries';
import { resolveProgramTimezone } from '../utilities/program-timezone-datetime';
import { useControlDayDateRoute } from '../composables/useControlDayDateRoute';
import { controlContextNamedRoute } from '../utilities/control-context-route';
import {
    CHECK_IN_FILTER_VALUES,
    filterRowsByCheckIn,
    filterRowsBySearch,
} from '../utilities/control-admin-table-filters';
import {
    parseBookingTicketCustomFields,
    parseProgramBookingQuestions,
} from '../utilities/program-booking-questions';
import AppEntityIndexPageLayout from '../layouts/AppEntityIndexPageLayout.vue';
import AppPageHeader from '../components/ui/AppPageHeader.vue';
import AppControlDayDateToolbar from '../components/control-panel/AppControlDayDateToolbar.vue';
import AppControlAdminTable from '../components/control-panel/AppControlAdminTable.vue';
import AppControlBookingEditDialog from '../components/control-panel/AppControlBookingEditDialog.vue';

type BookingTableRow = {
    id: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    trip_id: string | null;
    tripDepartureAt: string | null;
    departure: string;
    deleted_at: string | null;
    isCancelled: boolean;
    ticketCount: number;
    isCheckedIn: boolean;
    customAnswers: Record<string, string>;
};

type TableColumn = NonNullable<QTableProps['columns']>[number];

const powersync = getAppPowerSyncContext();
const { t, locale } = useI18n();
const $q = useQuasar();
const route = useRoute();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();
const { cancelBooking } = useBookingAdminCrud();
const showCancelledBookings = ref(false);
const searchText = ref('');
const selectedCheckInStates = ref<string[]>([]);

function onCheckInFilterUpdate(value: string[] | null): void {
    selectedCheckInStates.value = value ?? [];
}

const checkInFilterOptions = computed(() =>
    CHECK_IN_FILTER_VALUES.map((state) => ({
        label: checkInFilterLabel(state),
        value: state,
    })),
);
const bookingEditDialogOpen = ref(false);
const bookingEditId = ref('');
const { selectedDateYmd, showAllDates, goPrevDay, goNextDay, goToday } =
    useControlDayDateRoute();

const activeProgramIdRef = powersync.activeProgramIdRef;

const { data: programRow } = useLiveQuery(
    (qb) => {
        const col = powersync.collections.programs.value;
        const pid = activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return qb
            .from({ p: col })
            .where(({ p }) => eq(p.id, pid))
            .select(({ p }) => ({
                timezone: p.timezone,
                booking_questions: p.booking_questions,
            }));
    },
    [powersync.collections.programs, activeProgramIdRef],
);

const programTimezone = computed(() =>
    resolveProgramTimezone(
        liveQueryRows<{ timezone: string | null }>(programRow.value)[0]?.timezone,
    ),
);

const bookingQuestions = computed(() =>
    parseProgramBookingQuestions(
        liveQueryRows<{ booking_questions: unknown }>(programRow.value)[0]
            ?.booking_questions,
    ),
);

const { data: bookingsRaw } = useLiveQuery(
    (qb) => {
        const bookingsCol = powersync.collections.bookings.value;
        const tripsCol = powersync.collections.trips.value;
        const pid = activeProgramIdRef.value.trim();
        if (!bookingsCol || !tripsCol || pid.length === 0) {
            return undefined;
        }
        return qb
            .from({ b: bookingsCol })
            .leftJoin({ trip: tripsCol }, ({ b, trip }) => eq(b.trip_id, trip.id))
            .where(({ b }) => eq(b.program_id, pid))
            .select(({ b, trip }) => ({
                id: b.id,
                contact_name: b.contact_name,
                contact_email: b.contact_email,
                contact_phone: b.contact_phone,
                trip_id: b.trip_id,
                tripDepartureAt: trip.scheduled_departure_at,
                deleted_at: b.deleted_at,
            }));
    },
    [powersync.collections.bookings, powersync.collections.trips, activeProgramIdRef],
);

const { data: ticketsRaw } = useLiveQuery(
    (qb) => {
        const ticketsCol = powersync.collections.booking_tickets.value;
        const bookingsCol = powersync.collections.bookings.value;
        const pid = activeProgramIdRef.value.trim();
        if (!ticketsCol || !bookingsCol || pid.length === 0) {
            return undefined;
        }
        return qb
            .from({ bt: ticketsCol })
            .innerJoin({ b: bookingsCol }, ({ bt, b }) => eq(bt.booking_id, b.id))
            .where(({ b }) => eq(b.program_id, pid))
            .select(({ bt, b }) => ({
                bookingId: b.id,
                ticketId: bt.id,
                custom_fields: bt.custom_fields,
            }));
    },
    [powersync.collections.booking_tickets, powersync.collections.bookings, activeProgramIdRef],
);

const { data: checkInsRaw } = useLiveQuery(
    (qb) => {
        const checkInsCol = powersync.collections.check_ins.value;
        const bookingsCol = powersync.collections.bookings.value;
        const pid = activeProgramIdRef.value.trim();
        if (!checkInsCol || !bookingsCol || pid.length === 0) {
            return undefined;
        }
        return qb
            .from({ ci: checkInsCol })
            .innerJoin({ b: bookingsCol }, ({ ci, b }) => eq(ci.booking_id, b.id))
            .where(({ b }) => eq(b.program_id, pid))
            .select(({ ci, b }) => ({
                bookingId: b.id,
                checkInId: ci.id,
            }));
    },
    [powersync.collections.check_ins, powersync.collections.bookings, activeProgramIdRef],
);

const ticketCountByBookingId = computed(() => {
    const map = new Map<string, number>();
    for (const row of liveQueryRows<{ bookingId: string }>(ticketsRaw.value)) {
        const id = String(row.bookingId ?? '').trim();
        if (id.length === 0) {
            continue;
        }
        map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
});

const customAnswersByBookingId = computed(() => {
    const map = new Map<string, Record<string, string>>();
    for (const row of liveQueryRows<{
        bookingId: string;
        custom_fields: unknown;
    }>(ticketsRaw.value)) {
        const id = String(row.bookingId ?? '').trim();
        if (id.length === 0 || map.has(id)) {
            continue;
        }
        map.set(id, parseBookingTicketCustomFields(row.custom_fields));
    }
    return map;
});

const checkedInBookingIds = computed(() => {
    const set = new Set<string>();
    for (const row of liveQueryRows<{ bookingId: string }>(checkInsRaw.value)) {
        const id = String(row.bookingId ?? '').trim();
        if (id.length > 0) {
            set.add(id);
        }
    }
    return set;
});

const bookings = computed((): BookingTableRow[] =>
    liveQueryRows<Omit<BookingTableRow, 'isCancelled' | 'ticketCount' | 'isCheckedIn' | 'customAnswers' | 'departure'>>(bookingsRaw.value)
        .map((row) => ({
            ...row,
            departure: departureLabel(row.tripDepartureAt),
            isCancelled: isBookingCancelled(row.deleted_at),
            ticketCount: ticketCountByBookingId.value.get(String(row.id)) ?? 0,
            isCheckedIn: checkedInBookingIds.value.has(String(row.id)),
            customAnswers: customAnswersByBookingId.value.get(String(row.id)) ?? {},
        }))
        .filter((row) =>
            showCancelledBookings.value ? row.isCancelled : !row.isCancelled,
        ),
);

const dateFilteredBookings = computed(() => {
    const rows = bookings.value;
    if (showAllDates.value) {
        return rows;
    }
    const ymd = selectedDateYmd.value.trim();
    const tz = programTimezone.value;
    return rows.filter((row) =>
        tripDepartureMatchesLocalDateYmd(row.tripDepartureAt, ymd, tz),
    );
});

const checkInFilteredBookings = computed(() =>
    filterRowsByCheckIn(dateFilteredBookings.value, selectedCheckInStates.value),
);

const tableRows = computed(() =>
    filterRowsBySearch(checkInFilteredBookings.value, searchText.value, [
        (row) => row.contact_name,
        (row) => row.contact_email,
        (row) => row.contact_phone,
        (row) => row.departure,
        (row) => Object.values(row.customAnswers).join(' '),
    ]),
);

const totalFilteredTickets = computed(() =>
    tableRows.value.reduce((sum, row) => sum + row.ticketCount, 0),
);

const tableColumns = computed((): TableColumn[] => {
    const questionColumns: TableColumn[] = bookingQuestions.value.map((question) => ({
        name: questionColumnName(question),
        label: question,
        field: (row: BookingTableRow) => customAnswerLabel(row, question),
        align: 'left',
        sortable: true,
    }));

    return [
        {
            name: 'contact_name',
            label: t('programsControlAdmin.columnContact'),
            field: 'contact_name',
            align: 'left',
            sortable: true,
        },
        {
            name: 'contact_email',
            label: t('programsControlAdmin.columnEmail'),
            field: 'contact_email',
            align: 'left',
            sortable: true,
        },
        {
            name: 'contact_phone',
            label: t('programsControlAdmin.columnPhone'),
            field: 'contact_phone',
            align: 'left',
            sortable: true,
        },
        {
            name: 'departure',
            label: t('programsControlAdmin.columnDeparture'),
            field: 'departure',
            align: 'left',
            sortable: true,
        },
        {
            name: 'ticketCount',
            label: t('programsControlAdmin.columnTickets'),
            field: 'ticketCount',
            align: 'right',
            sortable: true,
        },
        {
            name: 'checkIn',
            label: t('programsControlAdmin.columnCheckIn'),
            field: (row: BookingTableRow) => checkInFilterLabel(
                row.isCheckedIn ? 'checked_in' : 'not_checked_in',
            ),
            align: 'left',
            sortable: true,
        },
        ...questionColumns,
        {
            name: 'actions',
            label: t('programsControlAdmin.columnActions'),
            field: 'id',
            align: 'right',
        },
    ];
});

function canCancelBooking(row: BookingTableRow): boolean {
    return !row.isCancelled && !row.isCheckedIn;
}

function confirmCancelBooking(row: BookingTableRow): void {
    confirm({
        title: t('programsControlAdmin.cancelBookingTitle'),
        message: t('programsControlAdmin.cancelBookingMessage'),
        onOk: async () => {
            try {
                await cancelBooking(String(row.id));
                $q.notify({ type: 'positive', message: t('programsControlAdmin.bookingCancelled') });
            } catch (error) {
                notifyError(error, t('programsControl.errorGeneric'));
            }
        },
    });
}

function checkInFilterLabel(state: (typeof CHECK_IN_FILTER_VALUES)[number]): string {
    return state === 'checked_in'
        ? t('programsControlAdmin.checkedIn')
        : t('programsControlAdmin.notCheckedIn');
}

function questionColumnName(question: string): string {
    return `question_${question.replace(/[^a-zA-Z0-9]+/g, '_')}`;
}

function customAnswerLabel(row: BookingTableRow, question: string): string {
    const answer = row.customAnswers[question];
    return answer != null && answer.length > 0 ? answer : '—';
}

function departureLabel(dep: string | null): string {
    if (dep == null || String(dep).trim() === '') {
        return '—';
    }
    try {
        return new Intl.DateTimeFormat(String(locale.value), {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(new Date(String(dep)));
    } catch {
        return String(dep);
    }
}

function bookingRowClass(row: Record<string, unknown>): string {
    return row.isCancelled === true ? 'opacity-60' : '';
}

function onBookingRowClick(row: Record<string, unknown>): void {
    const bookingId = String(row.id ?? '').trim();
    if (bookingId.length === 0) {
        return;
    }
    bookingEditId.value = bookingId;
    bookingEditDialogOpen.value = true;
}
</script>
