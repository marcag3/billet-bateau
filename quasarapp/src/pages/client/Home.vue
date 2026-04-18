<template>
    <div class="row">
        <!-- <div class="col-xs-12 col-sm-6 q-pa-md">
            <q-card>
                <q-card-section class="wicked-header text-h6 text-white">
                    <q-icon name="fas fa-book-open" />
                    {{ t("my") + " " + t("bookings") }}
                </q-card-section>
                <q-card-section v-if="!isLoading">
                    <q-card class="q-mb-sm q-pa-sm row" v-if="bookings.list.length == 0">
                        {{ t("no_booking") }}
                    </q-card>

                    <DisplayBooking v-for="booking in bookings.list" :key="booking.id" :booking="booking" />

                    <div class="row justify-center">
                        <q-btn
                            :label="t('create_booking')"
                            icon="fas fa-plus"
                            :to="{ name: 'client.booking' }"
                            color="primary"
                        />
                    </div>
                </q-card-section>
            </q-card>
        </div> -->
        <!-- <div class="col-xs-12 col-sm-6 q-pa-md">
            <q-card>
                <q-card-section class="wicked-header text-white text-h6">
                    <q-icon name="fas fa-anchor" />

                    {{ t("my") + " " + t("products") }}
                </q-card-section>
                <q-card-section v-if="!isLoading">
                    <q-card class="q-mb-sm q-pa-sm row" v-if="tickets.list == 0">
                        {{ t("no_product") }}
                    </q-card>

                    <DisplayTicket v-for="ticket in tickets.list" :key="ticket.id" :ticket="ticket" />

                    <div class="row justify-center">
                        <q-btn
                            :label="t('add_product')"
                            icon="fas fa-plus"
                            :to="{ name: 'client.store' }"
                            color="primary"
                        />
                    </div>
                </q-card-section>
            </q-card>
        </div> -->
        <div class="col-xs-12 col-sm-6 q-pa-md">
            <q-card>
                <q-card-section class="wicked-header text-white text-h6">
                    <q-icon name="fas fa-dharmachakra" />
                    {{ t("my") + " " + t("subscriptions") }}
                </q-card-section>
                <q-card-section v-if="!isLoading">
                    <q-card class="q-mb-sm q-pa-sm row" v-if="passes.list === 0">
                        {{ t("no_subscription") }}
                    </q-card>

                    <DisplayPass v-for="pass in passes.list" :key="pass.id" :pass="pass" />

                    <div class="row justify-center">
                        <q-btn
                            :label="t('add_subscription')"
                            icon="fas fa-plus"
                            :to="{ name: 'client.store' }"
                            color="primary"
                        />
                    </div>
                </q-card-section>
            </q-card>
        </div>
        <div class="col-xs-12 col-sm-6 q-pa-md">
            <q-card>
                <q-card-section class="wicked-header text-white text-h6">
                    <q-icon name="fab fa-angellist" />
                    {{ t("my") + " " + t("promotions") }}
                </q-card-section>
                <q-card-section v-if="!isLoading">
                    <q-card class="q-mb-sm q-pa-sm row" v-if="coupons.list.length === 0">
                        {{ t("no_promotion") }}
                    </q-card>

                    <DisplayCoupon v-for="coupon in coupons.list" :key="coupon.id" :coupon="coupon" />
                </q-card-section>
            </q-card>
        </div>
    </div>
</template>

<script>
    import { useBoatCategories } from "src/store/boatCategories";
    import { useBookings } from "src/store/bookings";
    import { useClients } from "src/store/clients";
    import { useRoutes } from "src/store/routes";
    import { useStops } from "src/store/stops";
    import { useTrips } from "src/store/trips";
    import { defineComponent, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import { ref } from "vue";
    import { useProducts } from "src/store/products";
    import { usePromotions } from "src/store/promotions";
    // import DisplayBooking from "src/components/displays/DisplayBooking.vue";
    // import DisplayTicket from "src/components/displays/DisplayTicket.vue";
    import DisplayPass from "src/components/displays/DisplayPass.vue";
    import DisplayCoupon from "src/components/displays/DisplayCoupon.vue";
    import { useSubscriptions } from "src/store/subscriptions";
    import { usePasses } from "src/store/passes";
    import { useCoupons } from "src/store/coupons";
    import { useTickets } from "src/store/tickets";
    import { useAppState } from "src/store/appState";

    export default defineComponent({
        name: "PageIndex",
        components: {
            // DisplayBooking,
            // DisplayTicket,
            DisplayPass,
            DisplayCoupon,
        },
        setup() {
            const { t } = useI18n();
            const clients = useClients();
            const bookings = useBookings();
            const tickets = useTickets();
            const passes = usePasses();
            const coupons = useCoupons();
            const trips = useTrips();
            const boatCategories = useBoatCategories();
            const routes = useRoutes();
            const stops = useStops();
            const isLoading = ref(false);
            const products = useProducts();
            const promotions = usePromotions();
            const subscriptions = useSubscriptions();
            const appState = useAppState();

            async function loadData() {
                isLoading.value = true;
                await Promise.all([
                    bookings.getIndex(),
                    tickets.getIndex(),
                    passes.getIndex(),
                    coupons.getIndex(),
                    trips.getIndexDebounce(),
                    boatCategories.getIndexDebounce(),
                    routes.getIndexDebounce(),
                    stops.getIndexDebounce(),
                    promotions.getIndexDebounce(),
                    products.getIndexDebounce(),
                    subscriptions.getIndexDebounce(),
                ]);
                return (isLoading.value = false);
            }

            onMounted(() => {
                loadData();
            });
            return {
                appState,
                t,
                clients,
                bookings,
                tickets,
                passes,
                coupons,
                trips,
                boatCategories,
                isLoading,
                products,
                subscriptions,
                promotions,
            };
        },
    });
</script>

<style>
    .wicked-header {
        background-image: url("/wickedbackground.svg");
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
    }
</style>
