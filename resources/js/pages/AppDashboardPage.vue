<template>
    <q-page class="q-pa-xl">
        <h1 class="text-h4 q-mb-md">{{ t('dashboard.title') }}</h1>
        <p class="text-body1 q-mb-lg">
            {{ t('dashboard.syncedDescription') }}
        </p>

        <q-banner v-if="hasError" class="bg-red-1 text-negative q-mb-md" rounded>
            {{ errorMessage }}
        </q-banner>

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
import { useTodos } from '../store/todos.store';

const draftTitle = ref('');
const isWorking = ref(false);
const { t, locale } = useI18n();

const { todos, isLoading, errorMessage, hasError, createTodo, toggleTodo, removeTodo, refresh } = useTodos();

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
