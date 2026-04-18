<template>
    <q-card flat class="shadow-2 q-my-sm">
        <q-form @submit="save" @reset="cancel">
            <q-card-section class="row">
                <div class="text-h4 q-px-sm">{{ t("planning_calendar") }}</div>
            </q-card-section>
            <q-card-section class="row justify-around">
                <q-select
                    :label="t('select_calendar')"
                    filled
                    :model-value="calendar.name"
                    @update:modelValue="select"
                    use-input
                    clearable
                    hide-dropdown-icon
                    input-debounce="0"
                    @new-value="add"
                    :options="calendarsList"
                    @filter="filterFn"
                    option-label="name"
                    option-value="id"
                    @blur="touch('name')"
                    :error="v$.name.$error"
                    class="col-grow q-px-sm"
                    :loading="calendars.isLoading"
                    :hint="t('new_value')"
                >
                    <template v-slot:before>
                        <q-icon name="event" />
                    </template>
                    <template v-slot:after>
                        <q-btn
                            dense
                            :disable="!calendar.name"
                            flat
                            icon="fas fa-trash"
                            color="negative"
                            @click="confirmDelete = true"
                        />
                    </template>
                    <template v-slot:error>
                        <template v-for="error of v$.name.$errors" :key="error.$uid">
                            <div v-html="error.$message" class="text-negative"></div>
                        </template>
                    </template>
                </q-select>
            </q-card-section>

            <q-card-section class="row justify-around">
                <!-- start_date -->
                <MyDateSelect
                    v-model="calendar.start_date"
                    @update:model-value="hasChanged = true"
                    class="col-sm-3 q-px-sm"
                    :label="t('start_date')"
                    :disable="!calendar.name"
                    @blur="touch('start_date')"
                    :validation="v$.start_date"
                />

                <!-- end_date -->
                <MyDateSelect
                    v-model="calendar.end_date"
                    @update:model-value="hasChanged = true"
                    class="col-sm-3 q-px-sm"
                    :label="t('end_date')"
                    :disable="!calendar.name"
                    @blur="touch('end_date')"
                    :validation="v$.end_date"
                />
            </q-card-section>
            <q-card-section class="justify-around">
                <!-- days buttons -->
                <div class="text-subtitle1 row justify-center">
                    {{ t("effective_days") }}
                </div>
                <div class="row justify-center">
                    <q-btn
                        v-for="(isActive, day) in calendar.days ?? []"
                        dense
                        :disable="!calendar.name"
                        :key="day"
                        :label="t(day)"
                        unlevated
                        :color="isActive ? 'secondary' : 'grey-9'"
                        :icon="isActive ? 'fas fa-check' : 'fas fa-times'"
                        class="q-mx-xs col-xs-5 col-sm-3 col-lg-1 no-border-radius"
                        @click="toggleDay(day)"
                    >
                    </q-btn>
                </div>
            </q-card-section>
            <q-card-actions align="right" v-if="hasChanged">
                <q-btn flat class="text-negative" :label="t('cancel')" type="reset" />
                <q-btn flat class="text-positive" :label="isNewCalendar ? t('create') : t('save')" type="submit" />
            </q-card-actions>
        </q-form>
        <PlanningCalendarTrips :calendar-id="calendar.id" v-if="calendar.id" />

        <ConfirmDelete v-if="confirmDelete" @deleteConfirmed="trash" />
    </q-card>
</template>

<script>
    import { ref, onMounted, computed } from "vue";
    import { useI18n } from "vue-i18n";
    import { useBoatCategories } from "../../store/boatCategories";
    import { useRoutes } from "../../store/routes";
    import { useBoatInventories } from "src/store/boatInventories";
    import { useQuasar } from "quasar";
    import ConfirmDelete from "components/forms_elements/ConfirmDelete";
    import { PlanningCalendar, usePlanningCalendars } from "src/store/planningCalendars";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";
    import { required, isDate } from "src/utilities/validators";
    import PlanningCalendarTrips from "components/PlanningCalendarTrips";
    import MyDateSelect from "src/components/forms_elements/MyDateSelect.vue";

    export default {
        name: "schedule",
        components: {
            ConfirmDelete,
            PlanningCalendarTrips,
            MyDateSelect,
        },

        setup() {
            const { t } = useI18n();
            const calendars = usePlanningCalendars();
            const boatCategories = useBoatCategories();
            const routes = useRoutes();
            const boatInventories = useBoatInventories();
            const isNewCalendar = ref(false);
            const calendar = ref(new PlanningCalendar());
            const hasChanged = ref(false);
            const $q = useQuasar();
            const calendarsList = ref();

            onMounted(() => {
                calendars.getIndex().then(() => (calendarsList.value = calendars.filteredList({})));
                boatCategories.getIndex();
                routes.getIndex();
                boatInventories.getIndex();
            });

            function select(calendarSelected) {
                const id = calendarSelected ? calendarSelected.id : null;
                if (!!id) {
                    Object.assign(
                        calendar.value,
                        calendars.list.find(({ id: listId }) => listId == id)
                    );
                    hasChanged.value = false;
                    isNewCalendar.value = false;
                } else if (!isNewCalendar.value) {
                    calendar.value = new PlanningCalendar();
                    hasChanged.value = false;
                    isNewCalendar.value = false;
                }
            }

            const validations = useServerValidations();
            const rules = {
                name: { required },
                start_date: { required, isDate },
                end_date: { required, isDate },
            };

            const v$ = useVuelidate(rules, calendar, {
                $externalResults: computed(() => validations.errors),
                $lazy: true,
            });

            return {
                t,
                calendars,
                calendar,
                isNewCalendar,
                hasChanged,
                select,
                confirmDelete: ref(false),
                v$,
                calendarsList,
                filterFn(val, update) {
                    update(() => {
                        calendarsList.value = calendars.filteredList({}, val);
                    });
                },
                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },

                toggleDay(day) {
                    calendar.value[day] = !calendar.value[day];
                    hasChanged.value = true;
                },
                cancel() {
                    select(calendar.value);
                },

                add(val, done) {
                    if (val.length > 0) {
                        if (calendars.list.findIndex(({ name }) => name == val) == -1) {
                            calendar.value = new PlanningCalendar({ name: val });
                            isNewCalendar.value = true;
                            done(calendar.value, "add-unique");
                        }
                    }
                },

                save() {
                    v$.value.$touch();
                    if (v$.value.$error) return;

                    async function request() {
                        if (isNewCalendar.value) {
                            return await calendars.store(calendar.value);
                        } else {
                            return await calendars.update(calendar.value);
                        }
                    }

                    request().then((updatedCalendar) => {
                        Object.assign(calendar.value, updatedCalendar);
                        hasChanged.value = false;
                        isNewCalendar.value = false;
                        $q.notify({
                            color: "positive",
                            icon: "cloud_done",
                            message: t("saved"),
                        });
                    });
                },

                trash() {
                    calendars.delete(calendar.value).then(() => {
                        select();
                    });
                    calendars.getIndex();
                },
            };
        },
    };
</script>
