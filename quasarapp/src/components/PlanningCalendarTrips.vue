<template>
    <q-card class="shadow-2 q-my-sm">
        <q-card-section class="row">
            <div class="text-h5 q-px-sm">{{ t("trip") }}</div>
            <q-btn flat dense @click="trips.getIndex({ calendarId: calendarId })" icon="fa fa-sync-alt"></q-btn>
        </q-card-section>
        <q-card-section>
            <q-table
                :loading="trips.isLoading"
                :columns="columns"
                :rows="trips.list"
                row-key="id"
                :selected-rows-label="trips.getSelectedString"
                selection="multiple"
                v-model:selected="trips.selected"
                :pagination="{ rowsPerPage: 50 }"
                hide-no-data
                :visible-columns="visibleColumns"
                table-header-class="bg-grey-3"
            >
                <template v-slot:top class="row justify-end">
                    <q-btn
                        dense
                        class="q-mx-sm"
                        flat
                        color="primary"
                        @click="tripsCreateShow = true"
                        :label="t('create')"
                        icon="fas fa-plus"
                    />
                    <q-space />
                    <q-btn
                        dense
                        class="q-mx-sm"
                        flat
                        color="negative"
                        :disable="trips.selected.length == 0"
                        :label="t('delete')"
                        icon="fas fa-trash"
                        @click="confirmDeleteShow = true"
                    />
                    <q-btn
                        dense
                        class="q-mx-sm"
                        flat
                        color="primary"
                        :disable="trips.selected.length == 0"
                        :label="t('edit')"
                        icon="fas fa-route"
                        @click="editShow = true"
                    />
                </template>
            </q-table>
        </q-card-section>
        <ConfirmDelete v-if="confirmDeleteShow" @deleteConfirmed="trash" @hide="confirmDeleteShow = false" />
        <PlanningCalendarTripsCreate
            v-if="tripsCreateShow"
            :service-id="calendarId"
            @change="trips.getIndex({ calendarId: calendarId })"
            @hide="tripsCreateShow = false"
        />

        <PlanningCalendarTripsEdit v-if="editShow" @change="onChange" @hide="editShow = false" />
    </q-card>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { computed, onMounted, ref, watch } from "vue";
    import { useQuasar } from "quasar";
    import ConfirmDelete from "components/forms_elements/ConfirmDelete";
    import PlanningCalendarTripsCreate from "components/models_edit/PlanningCalendarTripsCreate";
    import PlanningCalendarTripsEdit from "components/models_edit/PlanningCalendarTripsEdit";
    import { useTrips } from "../store/trips";

    export default {
        name: "CalendarTrips",
        components: {
            ConfirmDelete,
            PlanningCalendarTripsCreate,
            PlanningCalendarTripsEdit,
        },
        props: {
            calendarId: Number,
        },
        setup(props) {
            const { t } = useI18n();
            const $q = useQuasar();
            const trips = useTrips();
            const editShow = ref(false);
            const tripsCreateShow = ref(false);
            const confirmDeleteShow = ref(false);

            onMounted(() => {
                trips.getIndex({ calendarId: props.calendarId });
            });

            watch(props, () => {
                trips.getIndex({ calendarId: props.calendarId });
            });

            return {
                t,
                trips,
                confirmDeleteShow,
                tripsCreateShow,
                editShow,
                visibleColumns: computed(() => ($q.screen.gt.xs ? ["end_time"] : [])),
                columns: ref([
                    {
                        name: "route",
                        label: t("route"),
                        field: (row) => row.route.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "boat_category",
                        label: t("boat_category"),
                        field: (row) => row.boatCategory.name,
                        align: "left",
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "start_time",
                        label: t("start_time"),
                        field: (row) => row.start_time,
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "end_time",
                        label: t("end_time"),
                        field: (row) => row.end_time,
                        filter: "text",
                        required: false,
                    },
                    {
                        name: "guided",
                        label: t("guided"),
                        field: (row) => row.formatOption("guided"),
                        filter: "text",
                        required: true,
                    },
                    {
                        name: "boat_inventory",
                        label: t("boatInventory"),
                        field: (row) => row.boatInventory.displayName,
                        filter: "text",
                        required: true,
                    },
                ]),

                onChange() {
                    trips.getIndex({ calendarId: props.calendarId }).then(() => (editShow.value = false));
                },

                trash() {
                    trips.deleteSelected();
                    trips.getIndex({ calendarId: props.calendarId });
                },
            };
        },
    };
</script>
