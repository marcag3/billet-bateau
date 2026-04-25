<template>
    <router-view />
    <AppProgramControlContextNav />
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { useAppLayoutStore } from '../store/app-layout.store';
import AppProgramControlContextNav from './AppProgramControlContextNav.vue';

const layoutStore = useAppLayoutStore();
layoutStore.setLayoutAllowsInPlaceProgramIdSwitch(true);

onBeforeUnmount(() => {
    layoutStore.clearLayoutAllowsInPlaceProgramIdSwitch();
});
</script>
