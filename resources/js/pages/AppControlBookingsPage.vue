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
        />

        <AppEntityList>
            <AppEmptyListRow
                :show="filteredBookings.length === 0"
                :message="t('programsControlAdmin.bookingsEmpty')"
            />
            <q-item
                v-for="row in filteredBookings"
                :key="String(row.id)"
                class="p-4"
            >
                <q-item-section>
                    <q-item-label class="text-h6">
                        {{ row.contact_name ?? '—' }}
                    </q-item-label>
                    <q-item-label caption>{{ row.contact_email ?? '—' }}</q-item-label>
                    <q-item-label caption>
                        {{ departureLabel(row) }} · {{ row.ticketCount }}
                        {{ t('programsControlAdmin.tickets') }}
                    </q-item-label>
                    <q-item-label caption>
                        {{ checkInLabel(row.id) }}
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-btn
                        color="primary"
                        outline
                        dense
                        :label="t('common.edit')"
                        :to="controlContextNamedRoute(route, 'control.bookings.edit', {
                            bookingId: String(row.id),
                        })"
                    />
                </q-item-section>
            </q-item>
        </AppEntityList>
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useLiveQuery } from '@tanstack/vue-db';
import { eq } from '@tanstack/db';
import { getAppPowerSyncContext } from '../powersync/app-powersync.runtime';
import { liveQueryRows } from '../powersync/live-query-casts';
import { tripDepartureMatchesLocalDateYmd } from '../powersync/control-panel-queries';
import { resolveProgramTimezone } from '../utilities/program-timezone-datetime';
import { useControlDayDateRoute } from '../composables/useControlDayDateRoute';
import { controlContextNamedRoute } from '../utilities/control-context-route';
import AppEntityIndexPageLayout from '../layouts/AppEntityIndexPageLayout.vue';
import AppPageHeader from '../components/ui/AppPageHeader.vue';
import AppEntityList from '../components/ui/AppEntityList.vue';
import AppEmptyListRow from '../components/ui/AppEmptyListRow.vue';
import AppControlDayDateToolbar from '../components/control-panel/AppControlDayDateToolbar.vue';

type BookingListRow = {
    id: string;
    contact_name: string | null;
    contact_email: string | null;
    trip_id: string | null;
    tripDepartureAt: string | null;
    ticketCount: number;
};

const powersync = getAppPowerSyncContext();
const { t, locale } = useI18n();
const route = useRoute();
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
            .select(({ p }) => ({ timezone: p.timezone }));
    },
    [powersync.collections.programs, activeProgramIdRef],
);

const programTimezone = computed(() =>
    resolveProgramTimezone(
        liveQueryRows<{ timezone: string | null }>(programRow.value)[0]?.timezone,
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
                trip_id: b.trip_id,
                tripDepartureAt: trip.scheduled_departure_at,
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

const bookings = computed((): BookingListRow[] =>
    liveQueryRows<BookingListRow>(bookingsRaw.value).map((row) => ({
        ...row,
        ticketCount: ticketCountByBookingId.value.get(String(row.id)) ?? 0,
    })),
);

const filteredBookings = computed(() => {
    if (showAllDates.value) {
        return bookings.value;
    }
    const ymd = selectedDateYmd.value.trim();
    const tz = programTimezone.value;
    return bookings.value.filter((row) =>
        tripDepartureMatchesLocalDateYmd(row.tripDepartureAt, ymd, tz),
    );
});

function departureLabel(row: BookingListRow): string {
    const dep = row.tripDepartureAt;
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

function checkInLabel(bookingId: string): string {
    return checkedInBookingIds.value.has(String(bookingId))
        ? t('programsControlAdmin.checkedIn')
        : t('programsControlAdmin.notCheckedIn');
}
</script>
