<template>
    <q-layout view="lHh LpR fFf" class="app-shell">
        <q-header elevated reveal class="app-header">
            <q-toolbar class="app-toolbar">
                <q-btn
                    v-if="showSideNav && $q.screen.lt.md"
                    flat
                    dense
                    round
                    icon="menu"
                    class="q-mr-sm"
                    aria-label="Main menu"
                    @click="leftDrawerOpen = !leftDrawerOpen"
                />
                <q-toolbar-title class="app-toolbar-title">
                    <q-btn-dropdown
                        v-if="showAppNav && hasSelectedProgram"
                        flat
                        dense
                        color="white"
                        :label="currentProgramLabel"
                        :aria-label="t('common.switchProgram')"
                    >
                        <q-list>
                            <q-item
                                v-for="opt in programSwitcherOptions"
                                :key="opt.value"
                                v-close-popup
                                clickable
                                :active="opt.value === workspaceProgramId"
                                @click="() => onSwitchProgram(opt.value)"
                            >
                                <q-item-section>{{ opt.label }}</q-item-section>
                            </q-item>
                        </q-list>
                    </q-btn-dropdown>
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
            v-if="showSideNav"
            v-model="leftDrawerOpen"
            show-if-above
            bordered
            :width="260"
            class="app-drawer"
        >
            <q-scroll-area
                style="
                    height: calc(100% - 150px);
                    margin-top: 150px;
                    border-right: 1px solid #ddd;
                "
            >
                <q-list padding class="app-nav-list">
                    <q-item
                        v-ripple
                        clickable
                        class="app-nav-item--back"
                        @click="backToPrograms"
                    >
                        <q-item-section avatar>
                            <q-icon name="arrow_back" />
                        </q-item-section>
                        <q-item-section>{{
                            t("common.backToPrograms")
                        }}</q-item-section>
                    </q-item>

                    <q-separator class="q-my-sm" />

                    <q-item
                        v-for="link in mainNavLinks"
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
            <q-img
                class="absolute-top"
                src="/icons/logo.jpg"
                alt="Brand logo"
                style="height: 150px"
            >
                <div class="absolute-bottom bg-transparent">
                    <q-avatar size="56px" class="q-mb-sm">
                        <img src="/icons/logo.jpg" alt="Brand logo" />
                    </q-avatar>
                    <div class="text-weight-bold">
                        {{ authStore.user?.name }}
                    </div>
                    <div>{{ authStore.user?.email }}</div>
                </div>
            </q-img>
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

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "../store/auth.store";
import {
    programRowIsArchived,
    usePrograms,
} from "../models/programs/programs.model";
import AppOutboxToolbarMenu from "../components/AppOutboxToolbarMenu.vue";
import { setLocale } from "../utilities/i18n";

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const authStore = useAuthStore();
const { t, locale } = useI18n();
const { programs, ensureProgramsReady } = usePrograms();

const leftDrawerOpen = ref(false);

const showAppNav = computed(
    () => authStore.isAuthenticated || authStore.canAccessProtectedRoute(),
);

const isProgramWorkspace = computed(() =>
    route.matched.some((r) => r.meta.requiresSelectedProgram === true),
);

const workspaceProgramId = computed(() =>
    isProgramWorkspace.value
        ? String(route.params.programId ?? "").trim()
        : "",
);

const hasSelectedProgram = isProgramWorkspace;

const showSideNav = computed(
    () => showAppNav.value && isProgramWorkspace.value,
);

const visibleProgramIds = computed(() =>
    programs.value
        .filter(
            (p) =>
                p != null &&
                !programRowIsArchived(p as Record<string, unknown>),
        )
        .map((p) => String(p.id)),
);

const programSwitcherOptions = computed(() =>
    programs.value
        .filter(
            (p) =>
                p != null &&
                !programRowIsArchived(p as Record<string, unknown>),
        )
        .map((p) => ({
            label: String((p as Record<string, unknown>).name ?? ""),
            value: String(p.id),
        })),
);

const currentProgramLabel = computed(() => {
    const id = workspaceProgramId.value;
    if (id.length === 0) {
        return t("common.programs");
    }
    const row = programs.value.find((p) => p != null && String(p.id) === id);
    if (row) {
        return String((row as Record<string, unknown>).name ?? id);
    }
    return id;
});

const mainNavLinks = computed(() => {
    const programId = workspaceProgramId.value;
    if (programId.length === 0) {
        return [];
    }
    return [
        {
            key: "boats",
            to: { name: "boats.list" as const, params: { programId } },
            label: t("common.boats"),
            icon: "directions_boat",
            exact: true,
        },
        {
            key: "boat-types",
            to: { name: "boat-types.list" as const, params: { programId } },
            label: t("common.boatTypes"),
            icon: "category",
            exact: true,
        },
        {
            key: "reports",
            to: { name: "reports" as const, params: { programId } },
            label: t("common.reports"),
            icon: "assessment",
            exact: true,
        },
        {
            key: "settings",
            to: { name: "settings" as const, params: { programId } },
            label: t("common.settings"),
            icon: "settings",
            exact: true,
        },
    ];
});

const WORKSPACE_ROUTE_NAMES = new Set([
    "boats.list",
    "boat-types.list",
    "reports",
    "settings",
]);

watch(
    [visibleProgramIds, () => route.params.programId, isProgramWorkspace],
    ([ids]) => {
        if (!isProgramWorkspace.value) {
            return;
        }
        const pid = String(route.params.programId ?? "").trim();
        if (pid.length === 0) {
            return;
        }
        if (ids.length === 0) {
            void router.replace({ name: "programs.list" });
            return;
        }
        if (!ids.includes(pid)) {
            void router.replace({ name: "programs.list" });
        }
    },
    { immediate: true },
);

watch(
    () => route.fullPath,
    () => {
        if ($q.screen.lt.md) {
            leftDrawerOpen.value = false;
        }
    },
);

onMounted(() => {
    if (authStore.canAccessProtectedRoute()) {
        void ensureProgramsReady();
    }
});

const localeOptions = computed(() => [
    { label: "EN", value: "en" },
    { label: "FR", value: "fr" },
]);

const selectedLocale = computed({
    get: () => locale.value,
    set: (value: string) => {
        setLocale(value);
    },
});

/**
 * @param {string} programId
 */
function onSwitchProgram(programId: string) {
    const next = String(programId ?? "").trim();
    if (next.length === 0) {
        return;
    }
    if (next === workspaceProgramId.value) {
        return;
    }
    const name = route.name;
    if (name == null || typeof name !== "string") {
        return;
    }
    if (!WORKSPACE_ROUTE_NAMES.has(name)) {
        return;
    }
    void router.push({
        name: name as
            | "boats.list"
            | "boat-types.list"
            | "reports"
            | "settings",
        params: { ...route.params, programId: next },
        query: route.query,
    });
}

async function backToPrograms() {
    await router.push({ name: "programs.list" });
    if ($q.screen.lt.md) {
        leftDrawerOpen.value = false;
    }
}

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
    width: 100%;
    max-width: none;
    margin: 0;
    gap: 0.5rem;
    box-sizing: border-box;
}

.app-toolbar-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
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

.app-nav-list :deep(.app-nav-item--back) {
    font-weight: 600;
    color: #00164d;
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
