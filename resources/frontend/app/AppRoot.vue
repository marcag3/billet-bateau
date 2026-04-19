<template>
    <q-layout view="hHh lpR fFf">
        <q-header elevated>
            <q-toolbar>
                <q-toolbar-title>Application Workspace</q-toolbar-title>

                <q-space />

                <q-tabs shrink v-if="authStore.isAuthenticated || authStore.canAccessProtectedRoute()">
                    <q-route-tab label="Dashboard" to="/" />
                    <q-route-tab label="Reports" to="/reports" />
                    <q-route-tab label="Settings" to="/settings" />
                </q-tabs>

                <q-btn
                    v-if="authStore.isAuthenticated"
                    flat
                    color="white"
                    label="Logout"
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
                {{ authStore.authErrorMessage || 'Your session expired after reconnect. Please authenticate again.' }}
                <template #action>
                    <q-btn
                        flat
                        color="warning"
                        label="Reauthenticate"
                        @click="goToLogin"
                    />
                </template>
            </q-banner>

            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

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
