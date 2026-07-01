<template>
    <q-layout view="lHh LpR fFf">
        <q-header elevated reveal class="bg-[linear-gradient(180deg,color-mix(in_srgb,var(--q-primary)_90%,white)_90%,var(--q-secondary))] text-white">
            <q-toolbar class="gap-2 w-full max-w-none m-0 box-border">
                <q-btn v-if="showSideNav && $q.screen.lt.md" flat dense round icon="menu" class="mr-2"
                    aria-label="Main menu" @click="leftDrawerOpen = !leftDrawerOpen" />
                <q-toolbar-title class="app-toolbar-title flex items-center gap-3 min-w-0">
                    <q-btn-dropdown v-if="showAppNav && hasSelectedProgram" flat dense color="white"
                        :label="currentContextLabel" :aria-label="t('common.switchWorkspaceContext')">
                        <q-list>
                            <q-item v-for="opt in contextSwitcherOptions" :key="opt.value" v-close-popup clickable
                                :active="opt.value === currentContext" @click="() => onSwitchContext(opt.value)">
                                <q-item-section avatar>
                                    <q-icon :name="opt.icon" />
                                </q-item-section>
                                <q-item-section>{{ opt.label }}</q-item-section>
                            </q-item>
                        </q-list>
                    </q-btn-dropdown>
                </q-toolbar-title>

                <q-space />

                <AppSyncToolbarMenu v-if="authStore.canAccessProtectedRoute()" />

                <AppLanguageSwitcher on-dark-header />

                <AppUserMenu on-dark-header />

            </q-toolbar>
        </q-header>

        <q-drawer v-if="showSideNav" v-model="leftDrawerOpen" show-if-above bordered :width="260" class="bg-white">
            <q-scroll-area style="
                    height: calc(100% - 150px);
                    margin-top: 150px;
                    border-right: 1px solid #ddd;
                ">
                <q-list padding class="[&_.app-nav-item--active]:bg-[hsla(358,84%,52%,0.1)] [&_.app-nav-item--active]:text-secondary [&_.app-nav-item--active]:font-semibold [&_.app-nav-item--active]:border-l-[3px] [&_.app-nav-item--active]:border-l-primary">
                    <q-item v-ripple clickable class="font-semibold text-secondary" @click="backToPrograms">
                        <q-item-section avatar>
                            <q-icon name="arrow_back" />
                        </q-item-section>
                        <q-item-section>{{
                            t("common.backToPrograms")
                            }}</q-item-section>
                    </q-item>

                    <q-separator class="my-2" />

                    <div
                        :id="APP_PROGRAM_MAIN_NAV_TELEPORT_ID"
                        ref="programMainNavTarget"
                    />
                </q-list>
            </q-scroll-area>
            <q-img
                class="absolute-top"
                :src="workspaceProgramBannerUrl"
                :alt="workspaceProgramName"
                style="height: 150px"
            >
                <div
                    class="absolute-bottom bg-gradient-to-t from-black/70 to-transparent text-white px-3 pb-3 pt-8"
                >
                    <div class="text-weight-bold text-base leading-tight">
                        {{ workspaceProgramName }}
                    </div>
                </div>
            </q-img>
        </q-drawer>

        <q-page-container class="app-page-container">
            <AppAlertBanner v-if="authStore.requiresReauthentication" variant="warning" class="m-4">
                {{
                    authStore.authErrorMessage ||
                    t("auth.sessionExpiredAfterReconnect")
                }}
                <template #action>
                    <q-btn flat color="primary" :label="t('common.reauthenticate')" @click="goToLogin" />
                </template>
            </AppAlertBanner>

            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "../store/auth.store";
import { useAppLayoutStore } from "../store/app-layout.store";
import { useProgramWorkspaceLayout } from "../composables/useProgramWorkspaceLayout";
import {
    APP_PROGRAM_MAIN_NAV_TELEPORT_ID,
    provideAppProgramMainNavTarget,
} from "../utilities/app-layout-nav";
import AppSyncToolbarMenu from "../components/AppSyncToolbarMenu.vue";
import AppLanguageSwitcher from "../components/AppLanguageSwitcher.vue";
import AppUserMenu from "../components/AppUserMenu.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const layoutStore = useAppLayoutStore();
const { t, locale } = useI18n();
const leftDrawerOpen = ref(false);
const programMainNavTarget = useTemplateRef<HTMLElement>(
    "programMainNavTarget",
);
provideAppProgramMainNavTarget(programMainNavTarget);

const baseDocumentTitle = typeof document !== "undefined" ? document.title : "";

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
    workspaceProgramName,
    workspaceProgramBannerUrl,
    contextSwitcherOptions,
    currentContext,
    currentContextLabel,
    onSwitchContext,
} = useProgramWorkspaceLayout({
    t,
    leftDrawerOpen,
});

const showAppNav = computed(
    () => authStore.isAuthenticated || authStore.canAccessProtectedRoute(),
);

const showSideNav = computed(
    () => showAppNav.value && hasSelectedProgram.value,
);

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

</script>
