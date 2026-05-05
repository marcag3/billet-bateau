<template>
    <AppBootstrapGate :ready="hasBootstrapped">
        <router-view />
    </AppBootstrapGate>
    <AppProgramEditContextNav />
</template>

<script setup lang="ts">
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import AppBootstrapGate from "../components/ui/AppBootstrapGate.vue";
import AppProgramEditContextNav from "./AppProgramEditContextNav.vue";

const powersync = getAppPowerSyncContext();
const hasBootstrapped = powersync.hasBootstrappedCollection;
</script>
