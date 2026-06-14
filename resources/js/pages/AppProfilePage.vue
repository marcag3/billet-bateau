<template>
    <q-page class="q-pa-md">
        <AppPageHeader :title="t('profile.title')" />

        <AppCardSection :label="t('profile.profileSection')">
            <q-form @submit.prevent="onProfileSubmit">
                <div class="column q-gutter-y-md">
                    <q-input
                        v-model="profileName"
                        v-bind="profileNameProps"
                        outlined
                        dense
                        autocomplete="name"
                        :label="t('profile.name')"
                        :disable="isProfileSubmitting"
                    />

                    <q-input
                        v-model="profileEmail"
                        v-bind="profileEmailProps"
                        outlined
                        dense
                        type="email"
                        autocomplete="email"
                        :label="t('profile.email')"
                        :disable="isProfileSubmitting"
                    />

                    <div>
                        <q-btn
                            color="primary"
                            type="submit"
                            :label="t('profile.saveProfile')"
                            :loading="isProfileSubmitting"
                            :disable="!profileMeta.valid || isProfileSubmitting"
                        />
                    </div>
                </div>
            </q-form>
        </AppCardSection>

        <div class="q-mt-md">
            <AppCardSection :label="t('profile.passwordSection')">
            <q-form @submit.prevent="onPasswordSubmit">
                <div class="column q-gutter-y-md">
                    <q-input
                        v-model="currentPassword"
                        v-bind="currentPasswordProps"
                        type="password"
                        outlined
                        dense
                        autocomplete="current-password"
                        :label="t('profile.currentPassword')"
                        :disable="isPasswordSubmitting"
                    />

                    <q-input
                        v-model="password"
                        v-bind="passwordProps"
                        type="password"
                        outlined
                        dense
                        autocomplete="new-password"
                        :label="t('profile.newPassword')"
                        :disable="isPasswordSubmitting"
                    />

                    <q-input
                        v-model="passwordConfirmation"
                        v-bind="passwordConfirmationProps"
                        type="password"
                        outlined
                        dense
                        autocomplete="new-password"
                        :label="t('profile.confirmPassword')"
                        :disable="isPasswordSubmitting"
                    />

                    <div>
                        <q-btn
                            color="primary"
                            type="submit"
                            :label="t('profile.changePassword')"
                            :loading="isPasswordSubmitting"
                            :disable="!passwordMeta.valid || isPasswordSubmitting"
                        />
                    </div>
                </div>
            </q-form>
        </AppCardSection>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import { watch } from 'vue';
import { useAuthStore } from '../store/auth.store';
import { changePassword, updateProfile } from '../models/profile.api';
import {
    createChangePasswordFormSchema,
    createProfileFormSchema,
    type ChangePasswordFormValues,
    type ProfileFormValues,
} from '../models/profile.validation';
import { createQuasarFieldBinder } from '../validation/quasar-vee-fields';
import { useNotifyAsyncAction } from '../composables/useNotifyAsyncAction';
import { usePageLayout } from '../composables/usePageLayout';
import AppCardSection from '../components/ui/AppCardSection.vue';
import AppPageHeader from '../components/ui/AppPageHeader.vue';

const { t } = useI18n();
const authStore = useAuthStore();
const { runWithNotify } = useNotifyAsyncAction();

usePageLayout({ documentTitleKey: 'profile.title' });

const profileValidationSchema = createProfileFormSchema(t);
const {
    handleSubmit: handleProfileSubmit,
    defineField: defineProfileField,
    isSubmitting: isProfileSubmitting,
    meta: profileMeta,
    resetForm: resetProfileForm,
} = useForm<ProfileFormValues>({
    validationSchema: profileValidationSchema,
    initialValues: {
        name: '',
        email: '',
    } satisfies ProfileFormValues,
});

const profileField = createQuasarFieldBinder(defineProfileField);
const [profileName, profileNameProps] = profileField('name');
const [profileEmail, profileEmailProps] = profileField('email');

watch(
    () => authStore.user,
    (user) => {
        if (user == null) {
            return;
        }

        resetProfileForm({
            values: {
                name: String(user.name ?? ''),
                email: String(user.email ?? ''),
            },
        });
    },
    { immediate: true },
);

const passwordValidationSchema = createChangePasswordFormSchema(t);
const {
    handleSubmit: handlePasswordSubmit,
    defineField: definePasswordField,
    isSubmitting: isPasswordSubmitting,
    meta: passwordMeta,
    resetForm: resetPasswordForm,
} = useForm<ChangePasswordFormValues>({
    validationSchema: passwordValidationSchema,
    initialValues: {
        currentPassword: '',
        password: '',
        passwordConfirmation: '',
    } satisfies ChangePasswordFormValues,
});

const passwordField = createQuasarFieldBinder(definePasswordField);
const [currentPassword, currentPasswordProps] = passwordField('currentPassword');
const [password, passwordProps] = passwordField('password');
const [passwordConfirmation, passwordConfirmationProps] =
    passwordField('passwordConfirmation');

const onProfileSubmit = handleProfileSubmit(async (values) => {
    await runWithNotify(
        async () => {
            const user = await updateProfile({
                name: values.name,
                email: values.email,
            });
            authStore.markAuthenticated(user);
        },
        {
            successMessage: t('profile.profileUpdated'),
            errorGeneric: t('profile.unableUpdateProfile'),
        },
    );
});

const onPasswordSubmit = handlePasswordSubmit(async (values) => {
    await runWithNotify(
        async () => {
            await changePassword({
                currentPassword: values.currentPassword,
                password: values.password,
                passwordConfirmation: values.passwordConfirmation,
            });
            resetPasswordForm();
        },
        {
            successMessage: t('profile.passwordChanged'),
            errorGeneric: t('profile.unableChangePassword'),
        },
    );
});
</script>
