<template>
    <q-btn-dropdown
        v-if="authStore.isAuthenticated"
        flat
        dense
        no-caps
        class="ml-2"
        :class="onDarkHeader && 'text-[rgba(255,255,255,0.92)]'"
        :aria-label="t('profile.userMenu')"
    >
        <template #label>
            <div class="row items-center no-wrap gap-2">
                <q-avatar
                    size="28px"
                    :color="onDarkHeader ? 'white' : 'primary'"
                    :text-color="onDarkHeader ? 'primary' : 'white'"
                    font-size="12px"
                >
                    {{ userInitials }}
                </q-avatar>
                <span class="truncate max-w-48">{{ displayName }}</span>
            </div>
        </template>

        <q-list dense>
            <q-item v-close-popup clickable :to="{ name: 'profile' }">
                <q-item-section avatar>
                    <q-icon name="person" />
                </q-item-section>
                <q-item-section>{{ t("profile.title") }}</q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="disconnect">
                <q-item-section avatar>
                    <q-icon name="logout" />
                </q-item-section>
                <q-item-section>{{ t("common.disconnect") }}</q-item-section>
            </q-item>
        </q-list>
    </q-btn-dropdown>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useAuthStore } from "../store/auth.store";

withDefaults(
    defineProps<{
        /** White text for the elevated app admin header. */
        onDarkHeader?: boolean;
    }>(),
    {
        onDarkHeader: false,
    },
);

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const displayName = computed(() => {
    const name = authStore.user?.name?.trim();
    if (name) {
        return name;
    }

    const email = authStore.user?.email?.trim();
    if (email) {
        return email;
    }

    return t("profile.title");
});

const userInitials = computed(() => {
    const name = authStore.user?.name?.trim();
    if (name) {
        const parts = name.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
        }

        return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
    }

    const email = authStore.user?.email?.trim();
    if (email) {
        return (email.split("@")[0]?.slice(0, 2) ?? "").toUpperCase();
    }

    return "?";
});

async function disconnect() {
    await authStore.logout();
    await router.replace({ name: "login" });
}
</script>
