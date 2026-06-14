<template>
    <AppAlertBanner :variant="syncHealth.bannerVariant">
        <div class="text-weight-medium">
            {{ syncHealth.bannerTitle }}
        </div>
        <div
            v-if="syncHealth.bannerHint.length > 0"
            class="text-caption q-mt-xs"
        >
            {{ syncHealth.bannerHint }}
        </div>
    </AppAlertBanner>
</template>

<script setup lang="ts">
import AppAlertBanner from "./ui/AppAlertBanner.vue";
import { useSyncHealth } from "../composables/useSyncHealth";

const syncHealth = useSyncHealth();
</script>
