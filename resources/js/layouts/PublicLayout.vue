<template>
    <q-layout view="hHh lpr fFf">
        <q-header bordered class="bg-white text-grey-9">
            <q-toolbar>
                <q-space />
                <AppLanguageSwitcher />
            </q-toolbar>
        </q-header>
        <q-page-container class="sm:px-6 md:px-12">
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import AppLanguageSwitcher from '../components/AppLanguageSwitcher.vue';
</script>
