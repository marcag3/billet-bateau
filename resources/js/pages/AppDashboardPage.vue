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

        <q-banner v-if="hasOutboxCommitError" class="bg-red-1 text-negative q-mb-md" rounded>
            <template #avatar>
                <q-icon name="error_outline" color="negative" />
            </template>
            <div class="text-weight-medium">{{ t('sync.outboxCommitFailed') }}</div>
            <div class="text-caption q-mt-xs">{{ outboxCommitError }}</div>
            <template #action>
                <q-btn flat color="negative" :label="t('common.dismiss')" @click="dismissOutboxCommitError" />
            </template>
        </q-banner>

        <q-expansion-item
            v-if="outboxPendingCount > 0 || outboxPreview.length > 0"
            dense
            expand-separator
            class="bg-grey-2 rounded-borders q-mb-md"
            :label="t('sync.outboxTitle')"
            :caption="String(outboxPendingCount)"
        >
            <q-list dense bordered class="bg-white">
                <q-item v-if="outboxPreview.length === 0">
                    <q-item-section>{{ t('sync.outboxEmpty') }}</q-item-section>
                </q-item>
                <q-item v-for="row in outboxPreview" :key="row.id">
                    <q-item-section>
                        <q-item-label>{{ row.mutationFnName }}</q-item-label>
                        <q-item-label caption>{{ row.id }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        <q-item-label caption>{{ formatOutboxTime(row.createdAt) }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-expansion-item>

        <q-form class="row q-col-gutter-sm q-mb-lg" @submit.prevent="submitTodo">
            <div class="col">
                <q-input
                    v-model="draftTitle"
                    outlined
                    dense
                    :label="t('dashboard.newTodo')"
                    :placeholder="t('dashboard.newTodoPlaceholder')"
                    :disable="isWorking"
                />
            </div>

            <div class="col-auto">
                <q-btn color="primary" type="submit" :label="t('dashboard.add')" :loading="isWorking" />
            </div>
        </q-form>

        <q-list bordered separator class="bg-white rounded-borders">
            <q-item v-if="isLoading">
                <q-item-section>{{ t('dashboard.loadingTodos') }}</q-item-section>
            </q-item>

            <q-item v-else-if="todos.length === 0">
                <q-item-section>{{ t('dashboard.noSyncedTodos') }}</q-item-section>
            </q-item>

            <q-item v-for="todo in todos" :key="todo.id">
                <q-item-section side>
                    <q-checkbox
                        :model-value="Boolean(todo.completed)"
                        :disable="isWorking"
                        @update:model-value="toggle(todo)"
                    />
                </q-item-section>

                <q-item-section>
                    <q-item-label :class="{ 'text-strike text-grey-6': todo.completed }">
                        {{ todo.title }}
                    </q-item-label>
                    <q-item-label caption>
                        {{ t('dashboard.updated', { timestamp: formatTimestamp(todo.updated_at) }) }}
                    </q-item-label>
                    <q-item-label v-if="todo.$synced === false" caption class="text-amber-9">
                        {{ t('sync.rowPendingSync') }}
                    </q-item-label>
                </q-item-section>

                <q-item-section side>
                    <q-btn
                        flat
                        round
                        color="negative"
                        icon="delete"
                        :disable="isWorking"
                        @click="remove(todo)"
                    />
                </q-item-section>
            </q-item>
        </q-list>
    </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTodos } from '../models/todos/todos.model';

const draftTitle = ref('');
const isWorking = ref(false);
const { t, locale } = useI18n();

const {
    todos,
    isLoading,
    errorMessage,
    hasError,
    persistenceUnavailable,
    persistenceLimitedMessage,
    outboxPendingCount,
    outboxPreview,
    outboxCommitError,
    hasOutboxCommitError,
    dismissOutboxCommitError,
    refreshOutbox,
    createTodo,
    toggleTodo,
    removeTodo,
    refresh,
} = useTodos();

onMounted(() => {
    void refresh().finally(() => {
        void refreshOutbox();
    });
});

function formatOutboxTime(value) {
    if (!value) {
        return '—';
    }

    const d = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(d.getTime())) {
        return '—';
    }

    return d.toLocaleString(locale.value);
}

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

async function submitTodo() {
    const nextTitle = draftTitle.value.trim();

    if (nextTitle.length === 0) {
        return;
    }

    isWorking.value = true;

    try {
        await createTodo(nextTitle);
        draftTitle.value = '';
    } finally {
        isWorking.value = false;
    }
}

async function toggle(todo) {
    isWorking.value = true;

    try {
        await toggleTodo(todo);
    } finally {
        isWorking.value = false;
    }
}

async function remove(todo) {
    isWorking.value = true;

    try {
        await removeTodo(todo);
    } finally {
        isWorking.value = false;
    }
}
</script>
