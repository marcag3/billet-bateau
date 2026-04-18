<template>
    <BasicModelTable v-if="!bookings.isLoading" :resourceStore="bookings" :filters="filters" :columns="columns" />
</template>

<script>
    import { useBookings } from "src/store/bookings";
    import { computed, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import BasicModelTable from "./templates/BasicModelTable.vue";
    import { useProducts } from "src/store/products";
    import { useTrips } from "src/store/trips";
    import { useRoutes } from "src/store/routes";
    import { useUsers } from "src/store/users";
    import { useClients } from "src/store/clients";
    import { useBoatCategories } from "src/store/boatCategories";
    import { formatBool } from "src/utilities/formatters";
    export default {
        components: { BasicModelTable },
        props: {
            client_id: Number,
        },
        emits: ["updated"],
        // name: 'ComponentName',
        setup(props) {
            const { t } = useI18n();
            const bookings = useBookings();
            const products = useProducts();
            const trips = useTrips();
            const routes = useRoutes();
            const users = useUsers();
            const clients = useClients();
            const boatCategories = useBoatCategories();
            bookings.client_id = computed(() => props.client_id);

            onMounted(() => {
                props.client_id ? bookings.getIndex({ client_id: props.client_id }) : bookings.getIndex();
                products.getIndexDebounce();
                trips.getIndexDebounce();
                routes.getIndexDebounce();
                users.getIndexDebounce();
                clients.getIndexDebounce();
                boatCategories.getIndexDebounce();
            });
            return {
                t,
                bookings,
                filters: computed(() => {
                    if (props.client_id)
                        return {
                            client_id: {
                                path: "client_id",
                                value: props.client_id,
                            },
                        };
                    return {};
                }),
                columns: [
                    {
                        name: "client",
                        label: t("client"),
                        field: (row) => row.client.fullName,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "for_date",
                        label: t("for_date"),
                        field: (row) => row.formatDate("for_date"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "route",
                        label: t("route"),
                        field: (row) => row.trip.route.displayName,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "number_of_adults",
                        label: t("number_of_adults"),
                        field: (row) => row.number_of_adults,
                        align: "left",
                        filter: "number",
                        required: true,
                    },
                    {
                        name: "number_of_teens",
                        label: t("number_of_teens"),
                        field: (row) => row.number_of_teens,
                        align: "left",
                        filter: "number",
                        required: true,
                    },
                    {
                        name: "number_of_children",
                        label: t("number_of_children"),
                        field: (row) => row.number_of_children,
                        align: "left",
                        filter: "number",
                        required: true,
                    },
                    {
                        name: "number_of_boats",
                        label: t("number_of_boats"),
                        field: (row) => row.number_of_boats,
                        align: "left",
                        filter: "number",
                        required: true,
                    },
                    {
                        name: "is_guided",
                        label: t("is_guided"),
                        field: "is_guided",
                        align: "left",
                        filter: "boolean",
                        required: true,
                        format: formatBool,
                    },
                    {
                        name: "confirmed_at",
                        label: t("confirmed_at"),
                        field: (row) => row.formatDateTime("confirmed_at"),
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "is_full_boat",
                        label: t("is_full_boat"),
                        field: "is_full_boat",
                        align: "left",
                        filter: "boolean",
                        required: true,
                        format: formatBool,
                    },
                ],
            };
        },
    };
</script>
