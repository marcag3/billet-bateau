<template>
    <q-page class="public-home-page q-pa-md q-pa-sm-md" padding>
        <section class="hero-wrap text-center q-mb-lg">
            <div class="text-h3 q-mb-sm text-weight-bold">{{ t('common.welcome') }}</div>
            <p class="text-body1 q-mb-none hero-copy">
                {{ t('public.minimalDescription') }}
            </p>
        </section>

        <q-banner v-if="errorMessage" class="bg-red-1 text-negative q-mb-md" rounded>
            {{ errorMessage }}
        </q-banner>

        <div v-if="isLoading" class="row justify-center q-pa-xl">
            <q-spinner color="primary" size="48px" />
        </div>

        <div v-else>
            <p v-if="items.length === 0" class="text-body1 text-center q-mb-md">
                {{ t('publicHome.noPrograms') }}
            </p>
            <div v-else class="row q-col-gutter-md q-justify-center">
                <div
                    v-for="p in items"
                    :key="p.id"
                    class="col-12 col-sm-6 col-md-4 col-lg-3"
                >
                    <q-card
                        v-ripple
                        class="public-program-card cursor-pointer"
                        flat
                        bordered
                        @click="goProgram(p)"
                    >
                        <q-img
                            v-if="p.image_url"
                            :src="p.image_url"
                            :alt="p.name"
                            height="200px"
                            no-spinner
                            fit="cover"
                        />
                        <q-card-section v-else>
                            <div
                                class="row items-center justify-center"
                                :style="placeholderBoxStyle(p.theme_color)"
                            >
                                <q-icon name="image" size="4rem" color="white" />
                            </div>
                        </q-card-section>
                        <q-separator v-if="p.image_url" />
                        <q-card-section>
                            <div class="text-h6 text-weight-bold">{{ p.name }}</div>
                            <p
                                v-if="p.description"
                                class="text-body2 text-grey-7 q-mb-none ellipsis-3"
                            >
                                {{ p.description }}
                            </p>
                        </q-card-section>
                    </q-card>
                </div>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { fetchPublicJson } from '../services/publicApi.js';

type PublicProgramCard = {
    id?: string | number;
    name?: string;
    description?: string;
    path_segment?: string;
    image_url?: string;
    theme_color?: string;
};

const { t } = useI18n();
const router = useRouter();

const isLoading = ref(true);
const errorMessage = ref('');
const raw = ref<unknown>(null);

const items = computed((): PublicProgramCard[] => {
    if (!raw.value || typeof raw.value !== 'object') {
        return [];
    }
    const d = (raw.value as { data?: unknown }).data;
    return Array.isArray(d) ? (d as PublicProgramCard[]) : [];
});

function placeholderBoxStyle(themeColor: string | undefined) {
    return {
        minHeight: '200px',
        background: themeColor || '#0f172a',
    };
}

function goProgram(p: PublicProgramCard) {
    if (typeof p.path_segment === 'string' && p.path_segment.length > 0) {
        void router.push({ name: 'public.program', params: { identifier: p.path_segment } });
    }
}

onMounted(() => {
    isLoading.value = true;
    errorMessage.value = '';
    fetchPublicJson('/api/public/programs')
        .then((j) => {
            raw.value = j;
        })
        .catch(() => {
            errorMessage.value = t('publicHome.loadError');
        })
        .finally(() => {
            isLoading.value = false;
        });
});
</script>

<style scoped>
.ellipsis-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    line-clamp: 3;
    overflow: hidden;
}
.public-program-card {
    min-height: 6rem;
    border-radius: 1rem;
    border-color: rgba(0, 22, 77, 0.12);
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.public-program-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 30px rgba(0, 22, 77, 0.15);
    border-color: rgba(234, 29, 44, 0.36);
}

.public-home-page {
    padding-top: 2rem;
}

.hero-wrap {
    max-width: 48rem;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    border-radius: 1.25rem;
    background: linear-gradient(130deg, rgba(0, 22, 77, 0.94) 0%, rgba(12, 50, 131, 0.92) 60%, rgba(234, 29, 44, 0.92) 100%);
    color: #ffffff;
    box-shadow: 0 20px 38px rgba(0, 22, 77, 0.2);
}

.hero-copy {
    color: rgba(255, 255, 255, 0.88);
}
</style>
