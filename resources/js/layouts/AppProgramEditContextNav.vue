<template>
    <Teleport
        :to="teleportTo"
        :disabled="teleportDisabled"
        :key="teleportTargetKey"
    >
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
                v-if="isOwner"
                key="program-members"
                v-ripple
                clickable
                :to="{ name: 'programs.members', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="people" />
                </q-item-section>
                <q-item-section>{{
                    t("programsMembers.navLabel")
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
                key="guides"
                v-ripple
                clickable
                :to="{ name: 'guides.list', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="groups" />
                </q-item-section>
                <q-item-section>{{ t("common.guides") }}</q-item-section>
            </q-item>
            <q-item
                key="products"
                v-ripple
                clickable
                :to="{ name: 'products.list', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="inventory_2" />
                </q-item-section>
                <q-item-section>{{ t("common.products") }}</q-item-section>
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
            <q-item
                key="template-days"
                v-ripple
                clickable
                :to="{ name: 'template-days.list', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="architecture" />
                </q-item-section>
                <q-item-section>{{ t("common.templateDays") }}</q-item-section>
            </q-item>
            <q-item
                key="trips"
                v-ripple
                clickable
                :to="{ name: 'trips', params: { programId } }"
                exact
                active-class="app-nav-item--active"
            >
                <q-item-section avatar>
                    <q-icon name="calendar_month" />
                </q-item-section>
                <q-item-section>{{ t("common.trips") }}</q-item-section>
            </q-item>

        </template>
    </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useCurrentProgramMembershipRole } from "../composables/useCurrentProgramMembershipRole";
import { useAppProgramMainNavTeleport } from "../utilities/app-layout-nav";

const route = useRoute();
const { t } = useI18n();

const { teleportTo, teleportDisabled, teleportTargetKey } =
    useAppProgramMainNavTeleport();

const programId = computed(() => String(route.params.programId ?? "").trim());

const { isOwner } = useCurrentProgramMembershipRole(programId);
</script>
