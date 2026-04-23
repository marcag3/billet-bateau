<template>
    <q-page class="row items-center justify-center q-pa-md">
        <q-card class="app-setup-card q-pa-lg">
            <q-card-section class="q-pb-sm">
                <div class="text-h5">{{ t('setup.title') }}</div>
                <div class="text-body2 text-grey-7">{{ t('setup.subtitle') }}</div>
            </q-card-section>

            <q-card-section>
                <q-banner v-if="errorMessage.length > 0" class="bg-red-1 text-negative q-mb-md" rounded>
                    {{ errorMessage }}
                </q-banner>

                <q-form class="q-gutter-md" @submit.prevent="submitSetup">
                    <q-input
                        v-model="organizationName"
                        outlined
                        dense
                        :label="t('setup.organizationName')"
                        :disable="isSubmitting"
                    />

                    <q-input
                        v-model="email"
                        type="email"
                        outlined
                        dense
                        autocomplete="username"
                        :label="t('setup.adminEmail')"
                        :disable="isSubmitting"
                    />

                    <q-input
                        v-model="password"
                        type="password"
                        outlined
                        dense
                        autocomplete="new-password"
                        :label="t('auth.password')"
                        :disable="isSubmitting"
                    />

                    <q-input
                        v-model="passwordConfirmation"
                        type="password"
                        outlined
                        dense
                        autocomplete="new-password"
                        :label="t('setup.confirmPassword')"
                        :disable="isSubmitting"
                    />

                    <q-btn
                        type="submit"
                        color="primary"
                        :label="t('setup.completeSetup')"
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
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth.store';

const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const organizationName = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

async function submitSetup() {
    const normalizedOrganizationName = organizationName.value.trim();
    const normalizedEmail = email.value.trim();

    if (normalizedOrganizationName.length === 0 || normalizedEmail.length === 0 || password.value.length === 0) {
        errorMessage.value = t('setup.requiredFields');
        return;
    }

    if (password.value !== passwordConfirmation.value) {
        errorMessage.value = t('setup.passwordMismatch');
        return;
    }

    isSubmitting.value = true;
    errorMessage.value = '';

    try {
        await authStore.completeSetup({
            organizationName: normalizedOrganizationName,
            email: normalizedEmail,
            password: password.value,
            passwordConfirmation: passwordConfirmation.value,
        });
        await router.replace({ name: 'login' });
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : t('auth.unableCompleteSetup');
    } finally {
        isSubmitting.value = false;
    }
}
</script>

<style scoped>
.app-setup-card {
    width: 100%;
    max-width: 460px;
}
</style>
