<template>
    <router-view />
    <AppProgramCheckinContextNav />
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { useAppLayoutStore } from '../store/app-layout.store';
import AppProgramCheckinContextNav from './AppProgramCheckinContextNav.vue';

const layoutStore = useAppLayoutStore();
layoutStore.setLayoutAllowsInPlaceProgramIdSwitch(true);

onBeforeUnmount(() => {
    layoutStore.clearLayoutAllowsInPlaceProgramIdSwitch();
});
</script>
