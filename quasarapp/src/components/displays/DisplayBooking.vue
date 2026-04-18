<template>
    <q-card class="q-mb-sm q-pa-sm row">
        <div class="col-grow">
            <span class="text-subtitle1">
                {{ booking.displayDate + " " + booking.trip.start_time + " - " + booking.trip.end_time }}
                <br />
            </span>
            {{ booking.title }} <br />
            {{ booking.trip.route.firstRouteStop.stop.name }} <br />
            {{ booking.trip.boatCategory.name }} <br />
            {{ booking.displayIsGuided }}
        </div>
        <div class="col-shrink text-right">
            <q-chip
                v-if="booking.confirmed_at"
                icon="fas fa-check"
                color="positive"
                :label="t('confirmed')"
                text-color="white"
                size="sm"
            />
            <q-chip v-else icon="fas fa-times" color="dark" :label="t('not_confirmed')" text-color="white" size="sm" />
            <q-btn
                class="absolute-bottom-right q-ma-md"
                round
                icon="fas fa-trash"
                size="xs"
                color="negative"
                @click="confirmDelete(booking)"
            />
        </div>
    </q-card>
    <ConfirmDelete v-if="confirmDeleteShow" @deleteConfirmed="deleteBooking" @hide="confirmDeleteShow = false" />
</template>

<script>
    import { ref } from "vue";
    import { Booking, useBookings } from "src/store/bookings";
    import ConfirmDelete from "src/components/forms_elements/ConfirmDelete.vue";
    import { useI18n } from "vue-i18n";

    export default {
        // name: 'ComponentName',
        props: {
            booking: Booking,
        },
        components: {
            ConfirmDelete,
        },
        setup() {
            const { t } = useI18n();
            const confirmDeleteShow = ref(false);
            const bookings = useBookings();

            return {
                t,
                confirmDeleteShow,
                confirmDelete(booking) {
                    bookings.selected = [booking];
                    confirmDeleteShow.value = true;
                },

                deleteBooking() {
                    bookings.deleteSelected();
                },
            };
        },
    };
</script>
