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
            </q-card-section>
        </q-card>
    </q-page>
</template>

<script setup>
import { useForm } from 'vee-validate';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { createSetupFormSchema } from '../models/auth.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { useAuthStore } from '../store/auth.store';

const authStore = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const errorMessage = ref('');

const { handleSubmit, defineField, isSubmitting } = useForm({
    validationSchema: createSetupFormSchema(t),
    initialValues: {
        organizationName: '',
        email: '',
        password: '',
        passwordConfirmation: '',
    },
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

<style scoped>
.app-setup-card {
    width: 100%;
    max-width: 460px;
}
</style>
