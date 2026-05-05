<template>
    <AppBootstrapGate :ready="hasBootstrapped">
        <router-view />
    </AppBootstrapGate>
    <AppProgramEditContextNav />
</template>

<script setup lang="ts">
import { getAppPowerSyncBootstrappedRef } from "../powersync/app-powersync.runtime";
import AppBootstrapGate from "../components/ui/AppBootstrapGate.vue";
import AppProgramEditContextNav from "./AppProgramEditContextNav.vue";

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
</script>
