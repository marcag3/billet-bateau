<template>
    <q-banner
        v-if="visible"
        inline-actions
        rounded
        class="bg-amber-1 text-grey-10 mx-4 mt-2"
    >
        <div class="text-subtitle2 text-weight-medium">
            {{ t("inAppBrowser.title", { browser: browserName }) }}
        </div>
        <div class="text-body2 mt-1">
            {{ instructions }}
        </div>

        <template #action>
            <q-btn
                v-if="externalOpenUrl"
                flat
                color="primary"
                :label="t('inAppBrowser.openInBrowser', { browser: browserName })"
                @click="openInExternalBrowser"
            />
            <q-btn
                flat
                color="primary"
                :label="t('inAppBrowser.copyLink')"
                @click="copyCurrentLink"
            />
            <q-btn
                flat
                color="grey-8"
                :label="t('inAppBrowser.dismiss')"
                @click="dismiss"
            />
        </template>
    </q-banner>
</template>

<script setup lang="ts">
import { Notify } from "quasar";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
    META_IN_APP_BROWSER_BANNER_DISMISS_KEY,
    buildExternalBrowserOpenUrl,
    isAndroid,
    isIos,
    recommendedBrowser,
    shouldShowMetaInAppBrowserBanner,
} from "../utilities/in-app-browser";

const { t } = useI18n();
const visible = ref(false);

const browserName = computed(() => recommendedBrowser());
const externalOpenUrl = computed(() =>
    buildExternalBrowserOpenUrl(window.location.href),
);
const instructions = computed(() => {
    if (isIos()) {
        return t("inAppBrowser.iosInstructions");
    }

    if (isAndroid()) {
        return t("inAppBrowser.androidInstructions");
    }

    return t("inAppBrowser.genericInstructions", {
        browser: browserName.value,
    });
});

onMounted(() => {
    visible.value = shouldShowMetaInAppBrowserBanner();
});

function openInExternalBrowser(): void {
    const url = externalOpenUrl.value;

    if (url) {
        window.location.assign(url);
    }
}

async function copyCurrentLink(): Promise<void> {
    try {
        await navigator.clipboard.writeText(window.location.href);
        Notify.create({
            type: "positive",
            message: t("inAppBrowser.linkCopied"),
        });
    } catch {
        Notify.create({
            type: "negative",
            message: t("inAppBrowser.copyFailed"),
        });
    }
}

function dismiss(): void {
    sessionStorage.setItem(META_IN_APP_BROWSER_BANNER_DISMISS_KEY, "1");
    visible.value = false;
}
</script>
