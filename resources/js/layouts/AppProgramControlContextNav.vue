<template>
    <Teleport
        :to="teleportTo"
        :disabled="teleportDisabled"
        :key="teleportTargetKey"
    >
        <template v-if="programId.length > 0">
            <q-item
                key="control-home"
                v-ripple
                clickable
                :to="controlContextNamedRoute(route, 'programs.control')"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="dashboard" />
                </q-item-section>
                <q-item-section>{{ t("programsList.controlPanel") }}</q-item-section>
            </q-item>
            <q-item
                key="control-voyages"
                v-ripple
                clickable
                :to="controlContextNamedRoute(route, 'control.voyages.list')"
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="sailing" />
                </q-item-section>
                <q-item-section>{{ t("programsControlAdmin.voyagesNav") }}</q-item-section>
            </q-item>
            <q-item
                key="control-bookings"
                v-ripple
                clickable
                :to="controlContextNamedRoute(route, 'control.bookings.list')"
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="confirmation_number" />
                </q-item-section>
                <q-item-section>{{ t("programsControlAdmin.bookingsNav") }}</q-item-section>
            </q-item>
        </template>
    </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppProgramMainNavTeleport } from "../utilities/app-layout-nav";
import { controlContextNamedRoute } from "../utilities/control-context-route";

const route = useRoute();
const { t } = useI18n();

const { teleportTo, teleportDisabled, teleportTargetKey } =
    useAppProgramMainNavTeleport();

const programId = computed(() => String(route.params.programId ?? "").trim());
</script>
