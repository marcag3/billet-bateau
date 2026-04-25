<template>
    <AppAuthFormLayout
        :title="t('auth.signIn')"
        :subtitle="t('auth.authenticateWorkspace')"
        :error-message="errorMessage"
    >
        <q-form
            class="q-gutter-md"
            @submit.prevent="submitLogin"
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

            <q-input
                v-model="password"
                v-bind="passwordProps"
                type="password"
                outlined
                dense
                autocomplete="current-password"
                :label="t('auth.password')"
                :disable="isSubmitting"
            />

            <q-checkbox
                v-model="remember"
                :label="t('auth.rememberMe')"
                :disable="isSubmitting"
            />

            <q-btn
                type="submit"
                color="primary"
                :label="t('auth.signIn')"
                :loading="isSubmitting"
                :disable="isSubmitting"
                class="full-width"
            />
        </q-form>
    </AppAuthFormLayout>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';
import { createLoginFormSchema, type LoginFormValues } from '../models/auth.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { useAuthStore } from '../store/auth.store';
import AppAuthFormLayout from '../components/ui/AppAuthFormLayout.vue';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const remember = ref(true);
const errorMessage = ref('');

const validationSchema = createLoginFormSchema(t);
const { handleSubmit, defineField, isSubmitting } = useForm<LoginFormValues>({
    validationSchema,
    initialValues: {
        email: import.meta.env.DEV ? 'test@example.com' : '',
        password: import.meta.env.DEV ? 'password' : '',
    } satisfies LoginFormValues,
});

const quasarField = createQuasarFieldBinder(defineField);

const [email, emailProps] = quasarField('email');
const [password, passwordProps] = quasarField('password');

const submitLogin = handleSubmit(async (values) => {
    errorMessage.value = '';

    try {
        await authStore.login({
            email: values.email.trim(),
            password: values.password,
            remember: remember.value,
        });

        const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : '/';
        await router.replace(redirectTarget);
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : t('auth.unableAuthenticate');
    }
});
</script>
