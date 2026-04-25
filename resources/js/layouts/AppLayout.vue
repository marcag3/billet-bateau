<template>
    <q-layout view="hHh lpR fFf" class="app-shell">
        <q-header elevated class="app-header">
            <q-toolbar class="app-toolbar">
                <q-btn
                    v-if="showAppNav && $q.screen.lt.md"
                    flat
                    dense
                    round
                    icon="menu"
                    class="q-mr-sm"
                    aria-label="Main menu"
                    @click="leftDrawerOpen = !leftDrawerOpen"
                />

                <q-toolbar-title class="app-toolbar-title">
                    <img src="/icons/logo.jpg" alt="Brand logo" class="brand-logo" />
                    <span class="text-subtitle1 text-weight-bold">{{ t("common.appWorkspace") }}</span>
                </q-toolbar-title>

                <q-space />

                <AppOutboxToolbarMenu />

                <q-btn-toggle
                    v-model="selectedLocale"
                    class="q-ml-md app-locale-toggle"
                    dense
                    flat
                    toggle-color="accent"
                    :options="localeOptions"
                    :aria-label="t('common.language')"
                />

                <q-btn
                    v-if="authStore.isAuthenticated"
                    flat
                    color="grey-2"
                    :label="t('common.logout')"
                    class="q-ml-md"
                    @click="logout"
                />
            </q-toolbar>
        </q-header>

        <q-drawer
            v-if="showAppNav"
            v-model="leftDrawerOpen"
            show-if-above
            bordered
            :width="260"
            class="app-drawer"
        >
            <q-scroll-area class="fit">
                <q-list padding class="app-nav-list">
                    <q-item
                        v-for="link in navLinks"
                        :key="link.key"
                        v-ripple
                        clickable
                        :to="link.to"
                        :exact="link.exact === true"
                        active-class="app-nav-item--active"
                    >
                        <q-item-section avatar>
                            <q-icon :name="link.icon" />
                        </q-item-section>
                        <q-item-section>{{ link.label }}</q-item-section>
                    </q-item>
                </q-list>
            </q-scroll-area>
        </q-drawer>

        <q-page-container class="app-page-container">
            <q-banner
                v-if="authStore.requiresReauthentication"
                class="bg-amber-1 text-warning q-ma-md"
                rounded
                dense
            >
                {{
                    authStore.authErrorMessage ||
                    t("auth.sessionExpiredAfterReconnect")
                }}
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
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "../store/auth.store";
import AppOutboxToolbarMenu from "../components/AppOutboxToolbarMenu.vue";
import { setLocale } from "../utilities/i18n";

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const authStore = useAuthStore();
const { t, locale } = useI18n();

const leftDrawerOpen = ref(false);

const showAppNav = computed(
    () =>
        authStore.isAuthenticated || authStore.canAccessProtectedRoute(),
);

const navLinks = computed(() => [
    {
        key: "dashboard",
        to: "/",
        label: t("common.dashboard"),
        icon: "dashboard",
        exact: true,
    },
    {
        key: "programs",
        to: "/programs",
        label: t("common.programs"),
        icon: "event_note",
        exact: true,
    },
    {
        key: "programs-new",
        to: "/programs/new",
        label: t("common.newProgram"),
        icon: "add_circle_outline",
        exact: true,
    },
    {
        key: "boats",
        to: "/boats",
        label: t("common.boats"),
        icon: "directions_boat",
        exact: true,
    },
    {
        key: "boat-types",
        to: "/boat-types",
        label: t("common.boatTypes"),
        icon: "category",
        exact: true,
    },
    {
        key: "reports",
        to: "/reports",
        label: t("common.reports"),
        icon: "assessment",
        exact: true,
    },
    {
        key: "settings",
        to: "/settings",
        label: t("common.settings"),
        icon: "settings",
        exact: true,
    },
]);

watch(
    () => route.fullPath,
    () => {
        if ($q.screen.lt.md) {
            leftDrawerOpen.value = false;
        }
    },
);

const localeOptions = computed(() => [
    { label: "EN", value: "en" },
    { label: "FR", value: "fr" },
]);

const selectedLocale = computed({
    get: () => locale.value,
    set: (value) => {
        setLocale(value);
    },
});

async function goToLogin() {
    await router.push({
        name: "login",
        query: {
            redirect: router.currentRoute.value.fullPath,
        },
    });
}

async function logout() {
    await authStore.logout();
    await router.replace({ name: "login" });
}
</script>

<style scoped>
.app-shell {
    background: linear-gradient(180deg, #f6f8ff 0%, #eef2ff 100%);
}

.app-header {
    background: linear-gradient(90deg, #00164d 0%, #01256f 58%, #ea1d2c 100%);
    color: #ffffff;
}

.app-toolbar {
    width: min(76rem, 100%);
    margin: 0 auto;
    gap: 0.5rem;
}

.app-toolbar-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 11rem;
}

.brand-logo {
    width: 2.1rem;
    height: 2.1rem;
    border-radius: 9999px;
    border: 2px solid rgba(255, 255, 255, 0.55);
    object-fit: cover;
    background: #ffffff;
}

.app-drawer {
    background: #ffffff;
}

.app-nav-list :deep(.app-nav-item--active) {
    background: rgba(234, 29, 44, 0.1);
    color: #00164d;
    font-weight: 600;
    border-left: 3px solid #ea1d2c;
}

.app-locale-toggle {
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.14);
}

.app-page-container :deep(.q-page) {
    width: min(76rem, 100%);
    margin: 0 auto;
}
</style>
