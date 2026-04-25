<template>
    <AppAuthFormLayout
        max-width="setup"
        :title="t('setup.title')"
        :subtitle="t('setup.subtitle')"
        :error-message="errorMessage"
    >
        <q-form
            class="q-gutter-md"
            @submit.prevent="submitSetup"
        >
            <q-input
                v-model="organizationName"
                v-bind="organizationNameProps"
                outlined
                dense
                :label="t('setup.organizationName')"
                :disable="isSubmitting"
            />

            <q-input
                v-model="email"
                v-bind="emailProps"
                type="email"
                outlined
                dense
                autocomplete="username"
                :label="t('setup.adminEmail')"
                :disable="isSubmitting"
            />

            <q-input
                v-model="password"
                v-bind="passwordProps"
                type="password"
                outlined
                dense
                autocomplete="new-password"
                :label="t('auth.password')"
                :disable="isSubmitting"
            />

            <q-input
                v-model="passwordConfirmation"
                v-bind="passwordConfirmationProps"
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
    </AppAuthFormLayout>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { createSetupFormSchema, type SetupFormValues } from '../models/auth.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { useAuthStore } from '../store/auth.store';
import AppAuthFormLayout from '../components/ui/AppAuthFormLayout.vue';

const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const errorMessage = ref('');

const validationSchema = createSetupFormSchema(t);
const { handleSubmit, defineField, isSubmitting } = useForm<SetupFormValues>({
    validationSchema,
    initialValues: {
        organizationName: '',
        email: '',
        password: '',
        passwordConfirmation: '',
    } satisfies SetupFormValues,
});

const quasarField = createQuasarFieldBinder(defineField);

const [organizationName, organizationNameProps] = quasarField('organizationName');
const [email, emailProps] = quasarField('email');
const [password, passwordProps] = quasarField('password');
const [passwordConfirmation, passwordConfirmationProps] = quasarField('passwordConfirmation');

const submitSetup = handleSubmit(async (values) => {
    errorMessage.value = '';

    try {
        await authStore.completeSetup({
            organizationName: values.organizationName.trim(),
            email: values.email.trim(),
            password: values.password,
            passwordConfirmation: values.passwordConfirmation,
        });
        await router.replace({ name: 'login' });
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : t('auth.unableCompleteSetup');
    }
});
</script>
