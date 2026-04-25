<template>
    <q-page class="q-pa-md q-pa-sm-md" padding>
        <q-btn
            flat
            no-caps
            color="primary"
            :label="t('publicProgram.backToCatalog')"
            :to="{ name: 'public.home' }"
            class="q-mb-md"
        />

        <q-banner v-if="errorMessage" class="bg-red-1 text-negative q-mb-md" rounded>
            {{ errorMessage }}
        </q-banner>

        <div v-if="isLoading" class="row justify-center q-pa-xl">
            <q-spinner color="primary" size="48px" />
        </div>

        <template v-else-if="program">
            <h1 class="text-h4 q-mb-sm">{{ program.name }}</h1>
            <p v-if="program.description" class="text-body1 text-grey-8" style="white-space: pre-wrap">
                {{ program.description }}
            </p>
            <div v-if="(program.images ?? []).length" class="row q-col-gutter-sm q-my-md">
                <div
                    v-for="img in program.images"
                    :key="img.uuid"
                    class="col-6 col-sm-4 col-md-3"
                >
                    <q-img
                        v-if="img.url"
                        :src="img.url"
                        :alt="img.name"
                        class="rounded-borders"
                        fit="cover"
                    />
                </div>
            </div>
        </template>
    </q-page>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchPublicJson } from '../services/publicApi.js';

const props = defineProps({
    identifier: {
        type: String,
        required: true,
    },
});

const { t } = useI18n();
const isLoading = ref(true);
const errorMessage = ref('');
const program = ref(/** @type {Record<string, unknown> | null} */(null));

function load() {
    isLoading.value = true;
    errorMessage.value = '';
    const path = '/api/public/programs/' + encodeURIComponent(props.identifier);
    fetchPublicJson(path)
        .then((j) => {
            if (j && typeof j === 'object' && 'data' in j && j.data) {
                program.value = /** @type {Record<string, unknown>} */(j.data);
            } else {
                program.value = null;
            }
        })
        .catch(() => {
            program.value = null;
            errorMessage.value = t('publicProgram.notFound');
        })
        .finally(() => {
            isLoading.value = false;
        });
}

watch(
    () => props.identifier,
    () => {
        void load();
    },
    { immediate: true },
);
</script>
