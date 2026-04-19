<template>
    <q-layout view="hHh lpR fFf">
        <q-header elevated>
            <q-toolbar>
                <q-toolbar-title>{{ t('common.appWorkspace') }}</q-toolbar-title>

                <q-space />

                <q-tabs shrink v-if="authStore.isAuthenticated || authStore.canAccessProtectedRoute()">
                    <q-route-tab :label="t('common.dashboard')" to="/" />
                    <q-route-tab :label="t('common.reports')" to="/reports" />
                    <q-route-tab :label="t('common.settings')" to="/settings" />
                </q-tabs>

                <q-btn-toggle
                    v-model="selectedLocale"
                    class="q-ml-md"
                    dense
                    flat
                    toggle-color="accent"
                    :options="localeOptions"
                    :aria-label="t('common.language')"
                />

                <q-btn
                    v-if="authStore.isAuthenticated"
                    flat
                    color="white"
                    :label="t('common.logout')"
                    class="q-ml-md"
                    @click="logout"
                />
            </q-toolbar>
        </q-header>

        <q-page-container>
            <q-banner
                v-if="authStore.requiresReauthentication"
                class="bg-amber-1 text-warning q-ma-md"
                rounded
                dense
            >
                {{ authStore.authErrorMessage || t('auth.sessionExpiredAfterReconnect') }}
                <template #action>
                    <q-btn
                        flat
                        color="warning"
                        :label="t('common.reauthenticate')"
                        @click="goToLogin"
                    />
                </template>
            </q-banner>

            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { setLocale } from '../i18n';
import { useAuthStore } from './stores/authStore';

const router = useRouter();
const authStore = useAuthStore();
const { t, locale } = useI18n();

const localeOptions = computed(() => [
    { label: 'EN', value: 'en' },
    { label: 'FR', value: 'fr' },
]);

const selectedLocale = computed({
    get: () => locale.value,
    set: (value) => {
        setLocale(value);
    },
});

async function goToLogin() {
    await router.push({
        name: 'login',
        query: {
            redirect: router.currentRoute.value.fullPath,
        },
    });
}

async function logout() {
    await authStore.logout();
    await router.replace({ name: 'login' });
}
</script>
