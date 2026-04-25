<template>
    <q-layout view="hHh lpR fFf" class="public-shell">
        <q-header elevated class="public-header">
            <q-toolbar class="public-toolbar">
                <q-toolbar-title class="public-toolbar-title">
                    <img src="/icons/logo.jpg" alt="Brand logo" class="public-logo" />
                    <router-link
                        to="/"
                        class="public-title-link"
                    >{{ t('common.publicExperience') }}</router-link>
                </q-toolbar-title>
                <q-btn
                    v-if="showHomeTab"
                    class="public-nav-btn"
                    flat
                    :label="t('publicLayout.catalog')"
                    :to="{ name: 'public.home' }"
                />
                <q-btn class="public-nav-btn" color="grey-2" flat :label="t('common.openApp')" href="/app" />
            </q-toolbar>
        </q-header>

        <q-page-container class="public-page-container">
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

<style scoped>
.public-shell {
    background:
        linear-gradient(125deg, rgba(0, 22, 77, 0.06) 0%, rgba(255, 255, 255, 0.98) 42%),
        linear-gradient(180deg, #f8fafc 0%, #f2f4fb 100%);
}

.public-header {
    background: linear-gradient(90deg, #00164d 0%, #0a2f86 50%, #ea1d2c 100%);
    color: #ffffff;
}

.public-toolbar {
    width: min(76rem, 100%);
    margin: 0 auto;
}

.public-toolbar-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.public-logo {
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    border: 2px solid rgba(255, 255, 255, 0.5);
    object-fit: cover;
    background: #ffffff;
}

.public-title-link {
    color: #ffffff;
    text-decoration: none;
    font-weight: 700;
}

.public-nav-btn {
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.12);
}

.public-page-container :deep(.q-page) {
    width: min(76rem, 100%);
    margin: 0 auto;
}
</style>
