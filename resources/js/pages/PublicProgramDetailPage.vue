<template>
    <q-page class="q-pa-md q-pa-sm-md public-program-page" padding>
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
            <section class="program-surface">
                <h1 class="text-h4 q-mb-sm text-weight-bold">{{ program.name }}</h1>
                <p v-if="program.description" class="text-body1 text-grey-8 program-description">
                    {{ program.description }}
                </p>
                <div v-if="(program.images ?? []).length" class="row q-col-gutter-sm q-my-md">
                    <div
                        v-for="img in program.images ?? []"
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
            </section>
        </template>
    </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchPublicJson } from '../services/publicApi.js';

const props = defineProps<{
    identifier: string;
}>();

type ProgramImage = { uuid: string; url?: string; name?: string };
type PublicProgram = {
    name?: string;
    description?: string;
    images?: ProgramImage[];
};

const { t } = useI18n();
const isLoading = ref(true);
const errorMessage = ref('');
const program = ref<PublicProgram | null>(null);

function load() {
    isLoading.value = true;
    errorMessage.value = '';
    const path = '/api/public/programs/' + encodeURIComponent(props.identifier);
    fetchPublicJson(path)
        .then((j: unknown) => {
            if (j && typeof j === 'object' && 'data' in j && (j as { data: unknown }).data) {
                program.value = (j as { data: PublicProgram }).data;
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

<style scoped>
.public-program-page {
    padding-top: 2rem;
}

.program-surface {
    background: #ffffff;
    border: 1px solid rgba(0, 22, 77, 0.12);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 14px 28px rgba(0, 22, 77, 0.08);
}

.program-description {
    white-space: pre-wrap;
}
</style>
