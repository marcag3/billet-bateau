<template>
    <q-page class="row items-center justify-center q-pa-md">
        <q-card
            class="app-auth-form-layout__card q-pa-lg"
            :class="cardClass"
        >
            <q-card-section
                v-if="hasHeader"
                class="q-pb-sm"
            >
                <div class="text-h5">
                    <slot name="title">{{ title }}</slot>
                </div>
                <div
                    v-if="subtitle"
                    class="text-body2 text-grey-7"
                >
                    {{ subtitle }}
                </div>
                <div
                    v-else-if="$slots.subtitle"
                    class="text-body2 text-grey-7"
                >
                    <slot name="subtitle" />
                </div>
            </q-card-section>

            <q-card-section>
                <AppAlertBanner
                    v-if="errorMessage.length > 0"
                    variant="error"
                >
                    {{ errorMessage }}
                </AppAlertBanner>

                <slot />
            </q-card-section>
        </q-card>
    </q-page>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue';
import AppAlertBanner from './AppAlertBanner.vue';

const props = withDefaults(
    defineProps<{
        title?: string;
        subtitle?: string;
        errorMessage?: string;
        /** 'login' (420) | 'setup' (460) or pass cardClass. */
        maxWidth?: 'login' | 'setup' | 'none';
    }>(),
    {
        title: '',
        subtitle: '',
        errorMessage: '',
        maxWidth: 'login',
    },
);

const slots = useSlots();
const hasHeader = computed(
    () => Boolean(props.title) || Boolean(slots.title) || Boolean(props.subtitle) || Boolean(slots.subtitle),
);

const cardClass = computed(() => {
    if (props.maxWidth === 'none') {
        return '';
    }
    return props.maxWidth === 'setup' ? 'app-auth-form-layout--wide' : 'app-auth-form-layout--login';
});
</script>

<style scoped>
.app-auth-form-layout__card {
    width: 100%;
}
.app-auth-form-layout--login {
    max-width: 420px;
}
.app-auth-form-layout--wide {
    max-width: 460px;
}
</style>
