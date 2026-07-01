<template>
    <q-layout view="hHh lpr fFf">
        <q-header elevated class="bg-[linear-gradient(180deg,color-mix(in_srgb,var(--q-primary)_90%,white)_90%,var(--q-secondary))] text-white">
            <q-toolbar>
                <q-space />
                <AppLanguageSwitcher on-dark-header />
            </q-toolbar>
        </q-header>
        <PublicInAppBrowserBanner />
        <q-page-container class="sm:px-6 md:px-12">
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import AppLanguageSwitcher from '../components/AppLanguageSwitcher.vue';
import PublicInAppBrowserBanner from '../components/PublicInAppBrowserBanner.vue';
</script>
