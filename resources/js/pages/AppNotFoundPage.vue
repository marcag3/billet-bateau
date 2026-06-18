<template>
    <q-page class="row items-center justify-center p-4">
        <div class="text-center max-w-md">
            <AppPageHeader :title="t('notFoundPage.title')" />
            <q-btn unelevated color="primary" class="mt-6" icon="home" :label="t('notFoundPage.backHome')"
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