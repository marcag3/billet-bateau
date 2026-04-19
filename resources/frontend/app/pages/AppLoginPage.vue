<template>
    <q-page class="row items-center justify-center q-pa-md">
        <q-card class="app-login-card q-pa-lg">
            <q-card-section class="q-pb-sm">
                <div class="text-h5">Sign in</div>
                <div class="text-body2 text-grey-7">Authenticate to access your workspace.</div>
            </q-card-section>

            <q-card-section>
                <q-banner v-if="errorMessage.length > 0" class="bg-red-1 text-negative q-mb-md" rounded>
                    {{ errorMessage }}
                </q-banner>

                <q-form class="q-gutter-md" @submit.prevent="submitLogin">
                    <q-input
                        v-model="email"
                        type="email"
                        outlined
                        dense
                        autocomplete="username"
                        label="Email"
                        :disable="isSubmitting"
                    />

                    <q-input
                        v-model="password"
                        type="password"
                        outlined
                        dense
                        autocomplete="current-password"
                        label="Password"
                        :disable="isSubmitting"
                    />

                    <q-checkbox v-model="remember" label="Remember me" :disable="isSubmitting" />

                    <q-btn
                        type="submit"
                        color="primary"
                        label="Sign in"
                        :loading="isSubmitting"
                        :disable="isSubmitting"
                        class="full-width"
                    />
                </q-form>
            </q-card-section>
        </q-card>
    </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { bootstrapTodosSync } from '../sync/useTodosSync';
import { useAuthStore } from '../stores/authStore';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = ref('');
const password = ref('');
const remember = ref(true);
const isSubmitting = ref(false);
const errorMessage = ref('');

async function submitLogin() {
    const normalizedEmail = email.value.trim();
    const normalizedPassword = password.value;

    if (normalizedEmail.length === 0 || normalizedPassword.length === 0) {
        errorMessage.value = 'Email and password are required.';
        return;
    }

    isSubmitting.value = true;
    errorMessage.value = '';

    try {
        await authStore.login({
            email: normalizedEmail,
            password: normalizedPassword,
            remember: remember.value,
        });

        await bootstrapTodosSync();

        const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
        await router.replace(redirectTarget);
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : 'Unable to authenticate. Please try again.';
    } finally {
        isSubmitting.value = false;
    }
}
</script>

<style scoped>
.app-login-card {
    width: 100%;
    max-width: 420px;
}
</style>
