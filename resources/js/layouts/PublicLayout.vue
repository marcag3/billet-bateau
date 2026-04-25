<template>
    <q-layout view="hHh lpR fFf">
        <q-header elevated>
            <q-toolbar>
                <q-toolbar-title>
                    <router-link
                        to="/"
                        class="text-white"
                        style="text-decoration: none"
                    >{{ t('common.publicExperience') }}</router-link>
                </q-toolbar-title>
                <q-btn
                    v-if="showHomeTab"
                    flat
                    :label="t('publicLayout.catalog')"
                    :to="{ name: 'public.home' }"
                />
                <q-btn color="accent" flat :label="t('common.openApp')" href="/app" />
            </q-toolbar>
        </q-header>

        <q-page-container>
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const route = useRoute();

const showHomeTab = computed(
    () => String(route.name ?? '') === 'public.program',
);
</script>
