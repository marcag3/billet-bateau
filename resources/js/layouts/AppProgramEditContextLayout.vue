<template>
    <router-view />
    <AppProgramEditContextNav />
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { useAppLayoutStore } from '../store/app-layout.store';
import AppProgramEditContextNav from './AppProgramEditContextNav.vue';

const layoutStore = useAppLayoutStore();
layoutStore.setLayoutAllowsInPlaceProgramIdSwitch(true);

onBeforeUnmount(() => {
    layoutStore.clearLayoutAllowsInPlaceProgramIdSwitch();
});
</script>
