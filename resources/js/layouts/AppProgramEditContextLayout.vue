<template>
    <AppBootstrapGate :ready="hasBootstrapped">
        <router-view />
    </AppBootstrapGate>
    <AppProgramEditContextNav />
</template>

<script setup lang="ts">
import { onBeforeUnmount } from "vue";
import { useAppLayoutStore } from "../store/app-layout.store";
import { getAppPowerSyncBootstrappedRef } from "../powersync/app-powersync.runtime";
import AppBootstrapGate from "../components/ui/AppBootstrapGate.vue";
import AppProgramEditContextNav from "./AppProgramEditContextNav.vue";

const layoutStore = useAppLayoutStore();
layoutStore.setLayoutAllowsInPlaceProgramIdSwitch(true);

const hasBootstrapped = getAppPowerSyncBootstrappedRef();

onBeforeUnmount(() => {
    layoutStore.clearLayoutAllowsInPlaceProgramIdSwitch();
});
</script>
