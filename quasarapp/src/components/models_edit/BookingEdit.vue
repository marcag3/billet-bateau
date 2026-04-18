<template>
    <ModelEditTemplate
        :model-store="bookings"
        :model="booking"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('updated')"
    />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { Booking, useBookings } from "src/store/bookings";
    import { required, noRule, isDate } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import { useClients } from "src/store/clients";
    import { useUsers } from "src/store/users";
    import { useTrips } from "src/store/trips";

    export default {
        components: {
            ModelEditTemplate,
        },
        // name: 'ComponentName',
        props: { create: Boolean },
        emits: ["updated"],
        setup(props) {
            const { t } = useI18n(),
                bookings = useBookings(),
                booking = ref();
            const clients = useClients();
            const users = useUsers();
            const trips = useTrips();

            booking.value = props.create
                ? new Booking({ client_id: clients.current ? clients.current.id : null, number_of_adults: 1 })
                : new Booking(bookings.current);

            const rules = computed(() => ({
                client_id: { required },
                user_id: { noRule },
                for_date: { required, isDate },
                trip_id: { required },
                number_of_boats: { required },
                number_of_adults: { required },
                number_of_teens: { required },
                number_of_children: { required },
                is_guided: { required },
                is_full_boat: { required },
                confirmed_at: { isDate },
                note: { noRule },
            }));

            return {
                t,
                bookings,
                booking,
                rules,
                fields: [
                    { name: "client_id", component: "BasicModelSelect", attributes: { modelStore: clients } },
                    {
                        name: "user_id",
                        label: t("guide_id"),
                        component: "BasicModelSelect",
                        attributes: { modelStore: users },
                    },
                    { name: "for_date", component: "MyDateSelect", icon: "fas fa-calendar-day" },
                    { name: "trip_id", component: "BasicModelSelect", attributes: { modelStore: trips } },
                    { name: "number_of_boats", component: "MyInput", icon: "fas fa-cubes" },
                    { name: "number_of_adults", component: "MyInput", icon: "fas fa-user-tie" },
                    { name: "number_of_teens", component: "MyInput", icon: "fas fa-snowboarding" },
                    { name: "number_of_children", component: "MyInput", icon: "fas fa-child" },
                    { name: "is_guided", component: "MyToggle", icon: "fas fa-hiking" },
                    { name: "is_full_boat", component: "MyToggle", icon: "fas fa-expand-arrows-alt" },
                    {
                        name: "confirmed_at",
                        component: "MyDateSelect",
                        icon: "fas fa-calendar-check",
                        attributes: { clearable: true },
                    },
                    {
                        name: "note",
                        icon: "fas fa-pen",
                        component: "MyInput",
                        attributes: { type: "textarea" },
                    },
                ],
            };
        },
    };
</script>
