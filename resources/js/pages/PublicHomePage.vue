<template>
    <q-page>

        <h1 class="text-h3 mb-2 text-weight-bold">{{ t('common.welcome') }}</h1>
        <p class="text-body1 text-grey-8 mb-6">{{ t('publicHome.description') }}</p>


        <div v-if="isLoading" class="row justify-center p-4">
            <q-spinner color="primary" size="48px" />
        </div>

        <div v-else>
            <p v-if="items.length === 0" class="text-body1 text-center mb-4">
                {{ t('publicHome.noPrograms') }}
            </p>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="program in items" :key="program.id">
                    <q-card v-ripple class="public-program-card cursor-pointer" @click="goProgram(program)">
                        <q-img :src="programBannerUrlFromUrl(program.image_url)" :alt="program.name" :ratio="1 / 1">
                            <div class="absolute-bottom">
                                <div class="text-h6">{{ program.name }}</div>
                                <p v-if="program.description" class="text-subtitle2">
                                    {{ program.description }}
                                </p>
                                <div v-if="addressDisplayLines(program).length"
                                    class="row no-wrap items-start text-body2 text-grey-7 gap-2">
                                    <q-icon name="place" size="sm" class="pt-1" />
                                    <div>
                                        <div v-for="(line, i) in addressDisplayLines(
                                            program,
                                        )" :key="`addr-${String(program.id)}-${i}`">
                                            {{ line }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </q-img>
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
import { fetchPublicJson } from '../services/publicApi';
import { programBannerUrlFromUrl } from '../utilities/program-banner-url';

type PublicProgramCard = {
    id?: string | number;
    name?: string;
    description?: string;
    path_segment?: string;
    image_url?: string;
    theme_color?: string;
    line_1?: string | null;
    line_2?: string | null;
    city?: string | null;
    postal_code?: string | null;
    country?: string | null;
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

function addressDisplayLines(p: PublicProgramCard): string[] {
    const lines: string[] = [];
    const l1 = p.line_1 != null ? String(p.line_1).trim() : "";
    const l2 = p.line_2 != null ? String(p.line_2).trim() : "";
    if (l1.length > 0) {
        lines.push(l1);
    }
    if (l2.length > 0) {
        lines.push(l2);
    }
    const city = p.city != null ? String(p.city).trim() : "";
    const pc = p.postal_code != null ? String(p.postal_code).trim() : "";
    const cityLine = [city, pc].filter((x) => x.length > 0).join(", ");
    if (cityLine.length > 0) {
        lines.push(cityLine);
    }
    const country = p.country != null ? String(p.country).trim() : "";
    if (country.length > 0) {
        lines.push(country);
    }

    return lines;
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
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

.public-program-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 16px 30px hsla(226, 97%, 12%, 0.15);
    border-color: hsla(358, 84%, 52%, 0.36);
}
</style>
