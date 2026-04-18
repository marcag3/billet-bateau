<template>
    <BookingCandidateList @booked="bookingCreated" />
</template>

<script>
    import BookingCandidateList from "src/components/BookingCandidateList.vue";
    import { ref, onMounted } from "vue";
    import { useTrips } from "src/store/trips";
    import { useActivities } from "src/store/activities";
    import { useBoatCategories } from "src/store/boatCategories";
    import { useRouter } from "vue-router";
    import { useAppState } from "src/store/appState";

    export default {
        // name: 'PageName',
        components: {
            BookingCandidateList,
        },
        setup() {
            const step = ref("booking");
            const booking = ref();
            const trips = useTrips();
            const activities = useActivities();
            const boatCategories = useBoatCategories();
            const appState = useAppState();
            const router = useRouter();

            onMounted(() => {
                Promise.all([
                    boatCategories.getIndexDebounce(),
                    trips.getIndexDebounce(),
                    activities.getIndexDebounce(),
                ]);
            });

            return {
                step,
                booking,
                bookingCreated(newBooking) {
                    appState.lastBookingId = newBooking.id;
                    router.push(appState.nextStep("reservation"));
                },
            };
        },
    };
</script>
