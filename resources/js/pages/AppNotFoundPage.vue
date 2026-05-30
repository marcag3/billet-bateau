<template>
    <q-page class="row items-center justify-center q-pa-md app-not-found-page">
        <div class="text-center app-not-found-page__inner">
            <AppPageHeader :title="t('notFoundPage.title')" :description="t('notFoundPage.description')" />
            <q-btn unelevated color="primary" class="q-mt-lg" icon="home" :label="t('notFoundPage.backHome')"
                :to="homeLocation" />
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppPageHeader from '../components/ui/AppPageHeader.vue';
import { useAuthStore } from '../store/auth.store';

const { t } = useI18n();
const authStore = useAuthStore();

const homeLocation = computed((): RouteLocationRaw => {
    if (authStore.canAccessProtectedRoute()) {
        return { name: 'programs.list' };
    }
    if (authStore.installRequired === true) {
        return { name: 'setup' };
    }
    return { name: 'login' };
});
</script>

<style scoped>
.app-not-found-page__inner {
    max-width: 28rem;
}
</style>
