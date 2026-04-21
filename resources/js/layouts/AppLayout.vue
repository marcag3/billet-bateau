<template>
    <q-layout view="hHh lpR fFf">
        <q-header elevated>
            <q-toolbar>
                <q-toolbar-title>{{ t('common.appWorkspace') }}</q-toolbar-title>

                <q-space />

                <q-btn
                    flat
                    dense
                    icon="sync"
                    color="white"
                    class="q-mr-sm"
                    :aria-label="t('outbox.openOutbox')"
                >
                    <q-badge
                        v-if="pendingOutboxCount > 0"
                        color="accent"
                        floating
                        rounded
                    >
                        {{ pendingOutboxCount }}
                    </q-badge>

                    <q-menu
                        anchor="bottom right"
                        self="top right"
                        class="q-pa-sm"
                    >
                        <div class="text-subtitle2 q-mb-sm">{{ t('outbox.title') }}</div>
                        <q-list
                            dense
                            separator
                            style="min-width: 320px; max-width: 420px;"
                        >
                            <q-item v-if="!hasOutboxEntries">
                                <q-item-section class="text-grey-7">
                                    {{ t('outbox.empty') }}
                                </q-item-section>
                            </q-item>

                            <q-item
                                v-for="entry in outboxEntries"
                                :key="entry.id"
                            >
                                <q-item-section>
                                    <q-item-label>{{ formatOutboxOperation(entry) }}</q-item-label>
                                    <q-item-label caption class="text-grey-7">
                                        {{ formatOutboxTimestamp(entry.updatedAt) }}
                                    </q-item-label>
                                    <q-item-label
                                        v-if="entry.error"
                                        caption
                                        class="text-negative"
                                    >
                                        {{ entry.error }}
                                    </q-item-label>
                                </q-item-section>
                                <q-item-section side>
                                    <q-chip
                                        dense
                                        square
                                        :color="resolveOutboxStatusColor(entry.status)"
                                        text-color="white"
                                    >
                                        {{ resolveOutboxStatusLabel(entry.status) }}
                                    </q-chip>
                                </q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>

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
import { useAuthStore } from '../store/auth.store';
import { useTodos } from '../models/todos.model';
import { setLocale } from '../utilities/i18n';

const router = useRouter();
const authStore = useAuthStore();
const { t, locale } = useI18n();
const { hasOutboxEntries, outboxEntries, pendingOutboxCount } = useTodos();

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

function resolveOutboxStatusColor(status) {
    if (status === 'failed') {
        return 'negative';
    }

    if (status === 'queued') {
        return 'warning';
    }

    if (status === 'sending') {
        return 'info';
    }

    return 'positive';
}

function resolveOutboxStatusLabel(status) {
    if (status === 'failed') {
        return t('outbox.statusFailed');
    }

    if (status === 'queued') {
        return t('outbox.statusQueued');
    }

    if (status === 'sending') {
        return t('outbox.statusSending');
    }

    return t('outbox.statusSynced');
}

function formatOutboxOperation(entry) {
    if (entry.type === 'insert') {
        return t('outbox.operationInsert', { title: entry.title || t('outbox.untitledTodo') });
    }

    if (entry.type === 'delete') {
        return t('outbox.operationDelete', { title: entry.title || t('outbox.untitledTodo') });
    }

    return t('outbox.operationUpdate', { title: entry.title || t('outbox.untitledTodo') });
}

function formatOutboxTimestamp(timestamp) {
    if (typeof timestamp !== 'string' || timestamp.length === 0) {
        return '';
    }

    const date = new Date(timestamp);

    if (!Number.isFinite(date.getTime())) {
        return '';
    }

    return date.toLocaleString();
}

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
