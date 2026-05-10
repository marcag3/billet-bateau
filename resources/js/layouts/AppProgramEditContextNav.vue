<template>
    <Teleport :to="teleportTo">
        <template v-if="programId.length > 0">
            <q-item
                key="program-edit"
                v-ripple
                clickable
                :to="{ name: 'programs.edit', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="edit" />
                </q-item-section>
                <q-item-section>{{
                    t("programsList.editProgram")
                }}</q-item-section>
            </q-item>
            <q-item
                key="boats"
                v-ripple
                clickable
                :to="{ name: 'boats.list', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="directions_boat" />
                </q-item-section>
                <q-item-section>{{ t("common.boats") }}</q-item-section>
            </q-item>
            <q-item
                key="water-routes"
                v-ripple
                clickable
                :to="{ name: 'water-routes.list', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="timeline" />
                </q-item-section>
                <q-item-section>{{ t("common.waterRoutes") }}</q-item-section>
            </q-item>
            <q-item
                key="trips"
                v-ripple
                clickable
                :to="{ name: 'trips.list', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="event" />
                </q-item-section>
                <q-item-section>{{ t("common.trips") }}</q-item-section>
            </q-item>
            <q-item
                key="trips-calendar"
                v-ripple
                clickable
                :to="{ name: 'trips.calendar', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="calendar_view_week" />
                </q-item-section>
                <q-item-section>{{ t("common.calendar") }}</q-item-section>
            </q-item>
            <q-item
                key="template-days"
                v-ripple
                clickable
                :to="{ name: 'template-days.list', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="calendar_month" />
                </q-item-section>
                <q-item-section>{{ t("common.templateDays") }}</q-item-section>
            </q-item>
            <q-item
                key="ticket-types"
                v-ripple
                clickable
                :to="{ name: 'ticket-types.list', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="confirmation_number" />
                </q-item-section>
                <q-item-section>{{ t("common.ticketTypes") }}</q-item-section>
            </q-item>

        </template>
    </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { APP_PROGRAM_MAIN_NAV_TELEPORT_ID } from "../utilities/app-layout-nav";

const route = useRoute();
const { t } = useI18n();

const teleportTo = computed(() => `#${APP_PROGRAM_MAIN_NAV_TELEPORT_ID}`);

const programId = computed(() => String(route.params.programId ?? "").trim());
</script>
