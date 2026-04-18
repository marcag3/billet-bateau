<template>
    <q-dialog :model-value="true">
        <q-card>
            <q-card-section v-if="bookingCandidates.selected[0].bookings.length">
                <div class="text-h7">
                    {{ t("bookings") }}
                </div>
                <q-card v-for="booking in bookingCandidates.selected[0].bookings" :key="booking.id" class="row q-pa-sm">
                    <div class="col-grow">
                        {{ booking.title }} <br />
                        {{ t("note") + ": " + booking.note }} <br />
                        <template v-if="booking.client.id">
                            {{ t("client") + ": " + booking.client.fullName }} <br />
                        </template>
                        <template v-else> {{ t("user") + ": " + booking.user.name }} <br /> </template>
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
                        <q-chip
                            v-else
                            icon="fas fa-times"
                            color="dark"
                            :label="t('not_confirmed')"
                            text-color="white"
                            size="sm"
                        />
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
            </q-card-section>
            <q-card-actions>
                <q-btn :label="t('create_booking')" @click="bookingCreateShow = true" />
                <q-btn :label="t('create_sailing_plan')" @click="$emit('createSailingPlan')" v-close-popup />
            </q-card-actions>
        </q-card>
        <BookingCreate
            v-if="bookingCreateShow"
            @hide="bookingCreateShow = false"
            @update="$emit('update'), (bookingCreateShow = false)"
        />
        <ConfirmDelete v-if="confirmDeleteShow" @deleteConfirmed="trash" @hide="confirmDeleteShow = false" />
    </q-dialog>
</template>

<script>
    import { useBookingCandidates } from "src/store/bookingCandidates";
    import { useI18n } from "vue-i18n";
    import { useBookings } from "src/store/bookings";
    import { useClients } from "src/store/clients";
    import BookingCreate from "./BookingCreate.vue";
    import ConfirmDelete from "./forms_elements/ConfirmDelete.vue";
    import { ref } from "vue";
    export default {
        // name: 'ComponentName',
        components: {
            BookingCreate,
            ConfirmDelete,
        },
        emits: ["createSailingPlan", "update"],
        setup(props, { emit }) {
            const { t } = useI18n(),
                bookingCandidates = useBookingCandidates(),
                bookings = useBookings(),
                bookingCreateShow = ref(false),
                confirmDeleteShow = ref(false),
                clients = useClients();

            return {
                t,
                bookingCandidates,
                bookings,
                bookingCreateShow,
                confirmDeleteShow,
                confirmDelete(booking) {
                    bookings.selected = [booking];
                    confirmDeleteShow.value = true;
                },

                trash() {
                    bookings.deleteSelected().then(() => emit("update"));
                },
            };
        },
    };
</script>
