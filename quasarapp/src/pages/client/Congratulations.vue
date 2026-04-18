<template>
    <q-page class="row">
        <q-img src="water-3398111_1920.jpg">
            <div class="absolute-center text-center">
                <h4 v-if="appState.filledForm" class="text-h4">
                    {{ t("thanks_client_form") }}
                </h4>
                <h4 v-if="appState.lastBookingId && lastBooking.confirmed_at" class="text-h4">
                    {{ t("booking_confirmed") }}
                </h4>
                <p v-if="appState.lastBookingId">
                    {{ lastBooking.trip.boatCategory.activity.rules }}
                </p>
                <h4 v-if="appState.paymentCreated">
                    {{ t("thanks_payment_created") }}
                </h4>
                <p class="text-h6">
                    {{ t("greetings") }}
                </p>
            </div>
        </q-img>
    </q-page>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { onMounted, onUnmounted } from "vue";
    import { useAppState } from "src/store/appState";
    import { useBookings } from "src/store/bookings";

    export default {
        setup() {
            const { t } = useI18n();
            const appState = useAppState();
            const lastBooking = useBookings().find(appState.lastBookingId);

            onMounted(() => (appState.noPagePadding = true));

            onUnmounted(() => {
                appState.resetState();
            });

            return {
                lastBooking,
                appState,
                t,
            };
        },
    };
</script>
