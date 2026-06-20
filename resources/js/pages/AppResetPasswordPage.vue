<template>
    <AppAuthFormLayout
        :title="t('auth.resetPassword.title')"
        :subtitle="t('auth.resetPassword.subtitle')"
        :error-message="errorMessage"
        max-width="setup"
    >
        <template v-if="!hasValidLink">
            <AppAlertBanner variant="error">
                {{ t('auth.resetPassword.invalidLink') }}
            </AppAlertBanner>

            <div class="text-center mt-4">
                <router-link
                    class="text-primary"
                    :to="{ name: 'forgot-password' }"
                >
                    {{ t('auth.resetPassword.requestNewLink') }}
                </router-link>
            </div>
        </template>

        <q-form
            v-else
            class="column gap-4"
            @submit.prevent="submitResetPassword"
        >
            <q-input
                v-model="password"
                v-bind="passwordProps"
                type="password"
                outlined
                dense
                autocomplete="new-password"
                :label="t('auth.resetPassword.password')"
                :disable="isSubmitting"
            />

            <q-input
                v-model="passwordConfirmation"
                v-bind="passwordConfirmationProps"
                type="password"
                outlined
                dense
                autocomplete="new-password"
                :label="t('auth.resetPassword.passwordConfirmation')"
                :disable="isSubmitting"
            />

            <q-btn
                type="submit"
                color="primary"
                :label="t('auth.resetPassword.submit')"
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
import { computed, ref } from 'vue';
import { resetPassword } from '../models/auth.api';
import {
    createResetPasswordFormSchema,
    type ResetPasswordFormValues,
} from '../models/auth.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import AppAlertBanner from '../components/ui/AppAlertBanner.vue';
import AppAuthFormLayout from '../components/ui/AppAuthFormLayout.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const errorMessage = ref('');

const resetToken = computed(() =>
    typeof route.query.token === 'string' ? route.query.token : '',
);
const resetEmail = computed(() =>
    typeof route.query.email === 'string' ? route.query.email : '',
);
const hasValidLink = computed(
    () => resetToken.value.length > 0 && resetEmail.value.length > 0,
);

const validationSchema = createResetPasswordFormSchema(t);
const { handleSubmit, defineField, isSubmitting } = useForm<ResetPasswordFormValues>({
    validationSchema,
    initialValues: {
        password: '',
        passwordConfirmation: '',
    } satisfies ResetPasswordFormValues,
});

const quasarField = createQuasarFieldBinder(defineField);
const [password, passwordProps] = quasarField('password');
const [passwordConfirmation, passwordConfirmationProps] = quasarField('passwordConfirmation');

const submitResetPassword = handleSubmit(async (values) => {
    if (!hasValidLink.value) {
        return;
    }

    errorMessage.value = '';

    try {
        await resetPassword({
            token: resetToken.value,
            email: resetEmail.value,
            password: values.password,
            passwordConfirmation: values.passwordConfirmation,
        });

        await router.replace({
            name: 'login',
            query: { reset: 'success' },
        });
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : t('auth.resetPassword.unableReset');
    }
});
</script>
