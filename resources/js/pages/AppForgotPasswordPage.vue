<template>
    <AppAuthFormLayout
        :title="t('auth.forgotPassword.title')"
        :subtitle="t('auth.forgotPassword.subtitle')"
        :error-message="errorMessage"
    >
        <template v-if="successMessage">
            <AppAlertBanner variant="info">
                {{ successMessage }}
            </AppAlertBanner>

            <div class="text-center q-mt-md">
                <router-link
                    class="text-primary"
                    :to="{ name: 'login' }"
                >
                    {{ t('auth.forgotPassword.backToSignIn') }}
                </router-link>
            </div>
        </template>

        <template v-else>
            <q-form
                class="q-gutter-md"
                @submit.prevent="submitForgotPassword"
            >
                <q-input
                    v-model="email"
                    v-bind="emailProps"
                    type="email"
                    outlined
                    dense
                    autocomplete="username"
                    :label="t('auth.email')"
                    :disable="isSubmitting"
                />

                <q-btn
                    type="submit"
                    color="primary"
                    :label="t('auth.forgotPassword.submit')"
                    :loading="isSubmitting"
                    :disable="isSubmitting"
                    class="full-width"
                />
            </q-form>

            <div class="text-center q-mt-md">
                <router-link
                    class="text-primary"
                    :to="{ name: 'login' }"
                >
                    {{ t('auth.forgotPassword.backToSignIn') }}
                </router-link>
            </div>
        </template>
    </AppAuthFormLayout>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import { requestPasswordReset } from '../models/auth.api';
import {
    createForgotPasswordFormSchema,
    type ForgotPasswordFormValues,
} from '../models/auth.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import AppAlertBanner from '../components/ui/AppAlertBanner.vue';
import AppAuthFormLayout from '../components/ui/AppAuthFormLayout.vue';

const { t } = useI18n();

const errorMessage = ref('');
const successMessage = ref('');

const validationSchema = createForgotPasswordFormSchema(t);
const { handleSubmit, defineField, isSubmitting } = useForm<ForgotPasswordFormValues>({
    validationSchema,
    initialValues: {
        email: '',
    } satisfies ForgotPasswordFormValues,
});

const quasarField = createQuasarFieldBinder(defineField);
const [email, emailProps] = quasarField('email');

const submitForgotPassword = handleSubmit(async (values) => {
    errorMessage.value = '';

    try {
        successMessage.value = await requestPasswordReset({
            email: values.email.trim(),
        });
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : t('auth.forgotPassword.unableSend');
    }
});
</script>
