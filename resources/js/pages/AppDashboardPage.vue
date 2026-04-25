<template>
    <q-page class="q-pa-xl">
        <h1 class="text-h4 q-mb-md">{{ t('dashboard.title') }}</h1>
        <p class="text-body1 q-mb-lg">
            {{ t('dashboard.syncedDescription') }}
        </p>

        <q-banner v-if="hasError" class="bg-red-1 text-negative q-mb-md" rounded>
            {{ errorMessage }}
        </q-banner>

        <q-banner v-if="persistenceUnavailable" class="bg-amber-1 text-dark q-mb-md" rounded>
            {{ persistenceLimitedMessage }}
        </q-banner>

        <q-card flat bordered class="q-mb-lg bg-grey-1">
            <q-card-section>
                <div class="text-subtitle2 q-mb-xs">{{ t('sync.outboxTitle') }}</div>
                <p class="text-body2 q-mb-none">
                    <template v-if="hasPendingOutboxWrites">
                        {{ t('dashboard.pendingOutboxLine', { count: outboxPendingCount }) }}
                    </template>
                    <template v-else>{{ t('sync.outboxEmpty') }}</template>
                </p>
                <p v-if="hasOutboxCommitError" class="text-negative text-body2 q-mt-sm q-mb-none">
                    {{ outboxCommitError }}
                </p>
            </q-card-section>
        </q-card>

        <div class="row items-center justify-between q-mb-md">
            <h2 class="text-h6 q-my-none">{{ t('dashboard.programsHeading') }}</h2>
            <q-btn
                :to="{ name: 'programs.list' }"
                color="primary"
                outline
                :label="t('dashboard.managePrograms')"
            />
        </div>

        <q-list bordered separator class="bg-white rounded-borders">
            <q-item v-if="isLoading">
                <q-item-section>{{ t('dashboard.loadingPrograms') }}</q-item-section>
            </q-item>

            <q-item v-else-if="programs.length === 0">
                <q-item-section>{{ t('dashboard.noPrograms') }}</q-item-section>
            </q-item>

            <q-item v-for="program in programs" :key="program.id">
                <q-item-section>
                    <q-item-label>{{ program.name }}</q-item-label>
                    <q-item-label caption>
                        {{ t('dashboard.updated', { timestamp: formatTimestamp(program.updated_at) }) }}
                    </q-item-label>
                    <q-item-label v-if="program.$synced === false" caption class="text-amber-9">
                        {{ t('sync.rowPendingSync') }}
                    </q-item-label>
                </q-item-section>
            </q-item>
        </q-list>
    </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePrograms } from '../models/programs/programs.model';
import {
    getAppPowerSyncErrorMessageRef,
    getAppPowerSyncLoadingRef,
    getAppPowerSyncPersistenceUnavailableRef,
    getPersistenceLimitedMessage,
    useAppPowerSyncOutbox,
} from '../powersync/app-powersync.runtime';

const { t, locale } = useI18n();

const { programs, refresh } = usePrograms();

const {
    outboxPendingCount,
    outboxCommitError,
    hasOutboxCommitError,
    hasPendingOutboxWrites,
} = useAppPowerSyncOutbox();

const isLoading = getAppPowerSyncLoadingRef();
const errorMessage = getAppPowerSyncErrorMessageRef();
const persistenceUnavailable = getAppPowerSyncPersistenceUnavailableRef();
const hasError = computed(() => errorMessage.value.length > 0);
const persistenceLimitedMessage = getPersistenceLimitedMessage();

onMounted(() => {
    void refresh();
});

function formatTimestamp(value) {
    if (!value) {
        return t('dashboard.justNow');
    }

    const timestamp = Date.parse(value);

    if (Number.isNaN(timestamp)) {
        return t('dashboard.recently');
    }

    return new Date(timestamp).toLocaleString(locale.value);
}
</script>
