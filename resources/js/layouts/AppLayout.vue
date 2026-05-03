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
                        v-if="showAppNav && hasSelectedProgram && allowsInPlaceProgramIdSwitch"
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
                    <div
                        v-else-if="showAppNav && hasSelectedProgram"
                        class="text-body1 text-white text-weight-medium ellipsis"
                    >
                        {{ currentProgramLabel }}
                    </div>
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

                    <div :id="APP_PROGRAM_MAIN_NAV_TELEPORT_ID" />
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
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "../store/auth.store";
import { useAppLayoutStore } from "../store/app-layout.store";
import { useProgramWorkspaceLayout } from "../composables/useProgramWorkspaceLayout";
import { APP_PROGRAM_MAIN_NAV_TELEPORT_ID } from "../utilities/app-layout-nav";
import AppOutboxToolbarMenu from "../components/AppOutboxToolbarMenu.vue";
import { setLocale } from "../utilities/i18n";

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const layoutStore = useAppLayoutStore();
const { t, locale } = useI18n();
const leftDrawerOpen = ref(false);

const baseDocumentTitle =
    typeof document !== "undefined" ? document.title : "";

watch(
    [() => layoutStore.pageLayoutOverrides?.documentTitleKey, locale],
    ([key]) => {
        if (typeof document === "undefined") {
            return;
        }
        if (key != null && String(key).length > 0) {
            document.title = t(String(key));
        } else {
            document.title = baseDocumentTitle;
        }
    },
    { immediate: true },
);

const {
    isProgramWorkspace: hasSelectedProgram,
    workspaceProgramId,
    programSwitcherOptions,
    currentProgramLabel,
    allowsInPlaceProgramIdSwitch,
    onSwitchProgram,
} = useProgramWorkspaceLayout({
    t,
    layoutStore,
    leftDrawerOpen,
});

const showAppNav = computed(
    () => authStore.isAuthenticated || authStore.canAccessProtectedRoute(),
);

const showSideNav = computed(
    () => showAppNav.value && hasSelectedProgram.value,
);

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
    background: linear-gradient(280deg,
    color-mix(in lch, var(--rosy-granite) 30%, white) 0%,
    color-mix(in lch, var(--cerulean) 40%, white) 40%
      );
}

.app-header {
    background: color-mix(var(--deep-navy) 90%, white) ;
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
    background: hsla(358, 84%, 52%, 0.1);
    color: var(--deep-navy);
    font-weight: 600;
    border-left: 3px solid var(--racing-red);
}

.app-nav-list :deep(.app-nav-item--back) {
    font-weight: 600;
    color: var(--deep-navy);
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
