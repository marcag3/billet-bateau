<template>
    <AppAuthFormLayout
        :title="t('programsInvite.acceptTitle')"
        :subtitle="t('programsInvite.acceptSubtitle')"
        :error-message="errorMessage"
    >
        <div v-if="loading" class="row justify-center p-6">
            <q-spinner color="primary" size="40px" />
        </div>

        <template v-else-if="preview !== null && preview.valid">
            <q-list bordered separator class="rounded-borders mb-4">
                <q-item>
                    <q-item-section>
                        <q-item-label caption>{{
                            t("programsInvite.programLabel")
                        }}</q-item-label>
                        <q-item-label>{{ preview.programName }}</q-item-label>
                    </q-item-section>
                </q-item>
                <q-item>
                    <q-item-section>
                        <q-item-label caption>{{
                            t("programsInvite.invitedEmailLabel")
                        }}</q-item-label>
                        <q-item-label>{{ preview.email }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-list>

            <AppAlertBanner v-if="wrongAccount" variant="warning" class="mb-4">
                {{ t("programsInvite.wrongAccount") }}
                <div class="mt-2">
                    <q-btn
                        color="primary"
                        outline
                        :label="t('programsInvite.signOut')"
                        :disable="isSubmitting"
                        @click="onSignOut"
                    />
                </div>
            </AppAlertBanner>

            <q-form
                v-else-if="!authStore.isAuthenticated"
                class="column gap-4"
                @submit.prevent="acceptAsGuest"
            >
                <div class="text-subtitle2">
                    {{ t("programsInvite.createAccountTitle") }}
                </div>
                <q-input
                    v-model="guestName"
                    outlined
                    dense
                    :label="t('programsInvite.yourName')"
                    :disable="isSubmitting"
                    :rules="[(val) => (val && String(val).trim().length > 0) || t('programsInvite.fieldRequired')]"
                    lazy-rules
                />
                <q-input
                    v-model="guestPassword"
                    type="password"
                    outlined
                    dense
                    autocomplete="new-password"
                    :label="t('programsInvite.password')"
                    :disable="isSubmitting"
                    :rules="[(val) => (val && String(val).length > 0) || t('programsInvite.fieldRequired')]"
                    lazy-rules
                />
                <q-input
                    v-model="guestPasswordConfirmation"
                    type="password"
                    outlined
                    dense
                    autocomplete="new-password"
                    :label="t('programsInvite.confirmPassword')"
                    :disable="isSubmitting"
                    :rules="[(val) => (val && String(val).length > 0) || t('programsInvite.fieldRequired')]"
                    lazy-rules
                />
                <q-btn
                    type="submit"
                    color="primary"
                    class="full-width"
                    :loading="isSubmitting"
                    :disable="isSubmitting"
                    :label="t('programsInvite.acceptButton')"
                />
            </q-form>

            <q-form v-else class="column gap-4" @submit.prevent="acceptAuthenticated">
                <q-btn
                    type="submit"
                    color="primary"
                    class="full-width"
                    :loading="isSubmitting"
                    :disable="isSubmitting"
                    :label="t('programsInvite.acceptButton')"
                />
            </q-form>

            <div class="text-center mt-4">
                <router-link
                    class="text-primary"
                    :to="{ name: 'login', query: { redirect: route.fullPath } }"
                >
                    {{ t("programsInvite.goToSignIn") }}
                </router-link>
            </div>
        </template>
    </AppAuthFormLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import {
    accept as inviteAccept,
    show as invitePreview,
} from "../actions/App/Http/Controllers/Auth/ProgramInvitationAcceptController";
import AppAuthFormLayout from "../components/ui/AppAuthFormLayout.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";
import { useAuthStore } from "../store/auth.store";
import {
    buildJsonHeaders,
    fetchWith419Retry,
    getCsrfHeaders,
    parseJsonPayload,
} from "../services/http.client";
import { ensureSanctumCsrfCookie } from "../models/programs/program-invitations.api";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const errorMessage = ref("");
const isSubmitting = ref(false);

const guestName = ref("");
const guestPassword = ref("");
const guestPasswordConfirmation = ref("");

const token = computed(() => String(route.params.token ?? "").trim());

type InvitePreview =
    | { valid: true; programName: string; email: string }
    | { valid: false; reason: string };

const preview = ref<InvitePreview | null>(null);

const wrongAccount = computed(() => {
    if (preview.value === null || !preview.value.valid) {
        return false;
    }
    if (!authStore.isAuthenticated || authStore.user === null) {
        return false;
    }
    return (
        String(authStore.user.email).toLowerCase() !==
        preview.value.email.toLowerCase()
    );
});

function reasonToMessage(reason: string): string {
    if (reason === "expired") {
        return t("programsInvite.expiredInvite");
    }
    if (reason === "accepted") {
        return t("programsInvite.acceptedInvite");
    }
    if (reason === "revoked") {
        return t("programsInvite.revokedInvite");
    }
    return t("programsInvite.invalidInvite");
}

async function loadPreview() {
    loading.value = true;
    errorMessage.value = "";
    preview.value = null;

    const tkn = token.value;
    if (tkn.length !== 64) {
        errorMessage.value = t("programsInvite.invalidInvite");
        loading.value = false;
        return;
    }

    try {
        const response = await fetch(invitePreview.url(tkn), {
            method: "GET",
            credentials: "same-origin",
            headers: buildJsonHeaders(
                {
                    Accept: "application/json",
                    "Cache-Control": "no-cache",
                },
                { includeRequestedWith: true },
            ),
        });

        const payload = await parseJsonPayload(response);

        if (!response.ok) {
            errorMessage.value = t("programsInvite.loadFailed");
            return;
        }

        const valid = Boolean((payload as { valid?: unknown }).valid);
        if (!valid) {
            const reason = String(
                (payload as { reason?: unknown }).reason ?? "invalid",
            );
            errorMessage.value = reasonToMessage(reason);
            preview.value = { valid: false, reason };
            return;
        }

        const data = (payload as { data?: Record<string, unknown> }).data ?? {};
        preview.value = {
            valid: true,
            programName: String(data.program_name ?? ""),
            email: String(data.email ?? ""),
        };
    } catch {
        errorMessage.value = t("programsInvite.loadFailed");
    } finally {
        loading.value = false;
    }
}

function firstValidationMessage(
    payload: Record<string, unknown>,
): string | null {
    const errors = payload.errors as Record<string, string[] | undefined> | undefined;
    if (!errors) {
        return null;
    }
    for (const messages of Object.values(errors)) {
        if (Array.isArray(messages) && messages.length > 0) {
            return String(messages[0]);
        }
    }
    return null;
}

async function acceptAuthenticated() {
    const tkn = token.value;
    if (tkn.length !== 64 || preview.value === null || !preview.value.valid) {
        return;
    }

    errorMessage.value = "";
    isSubmitting.value = true;

    try {
        await ensureSanctumCsrfCookie();
        const response = await fetchWith419Retry(inviteAccept.url(tkn), {
            method: "POST",
            headers: buildJsonHeaders(
                {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...getCsrfHeaders(),
                },
                { includeRequestedWith: true },
            ),
            body: JSON.stringify({}),
        });

        const payload = await parseJsonPayload(response);

        if (!response.ok) {
            errorMessage.value =
                firstValidationMessage(payload) ??
                String(
                    (payload as { message?: unknown }).message ??
                        t("programsInvite.acceptFailed"),
                );
            return;
        }

        await authStore.refreshSession({
            markInitialized: true,
            silent: true,
        });
        await router.replace({ name: "programs.list" });
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : t("programsInvite.acceptFailed");
    } finally {
        isSubmitting.value = false;
    }
}

async function acceptAsGuest() {
    const tkn = token.value;
    if (tkn.length !== 64 || preview.value === null || !preview.value.valid) {
        return;
    }

    errorMessage.value = "";
    isSubmitting.value = true;

    try {
        await ensureSanctumCsrfCookie();
        const response = await fetchWith419Retry(inviteAccept.url(tkn), {
            method: "POST",
            headers: buildJsonHeaders(
                {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...getCsrfHeaders(),
                },
                { includeRequestedWith: true },
            ),
            body: JSON.stringify({
                name: guestName.value.trim(),
                password: guestPassword.value,
                password_confirmation: guestPasswordConfirmation.value,
            }),
        });

        const payload = await parseJsonPayload(response);

        if (!response.ok) {
            errorMessage.value =
                firstValidationMessage(payload) ??
                String(
                    (payload as { message?: unknown }).message ??
                        t("programsInvite.acceptFailed"),
                );
            return;
        }

        await authStore.refreshSession({
            markInitialized: true,
            silent: true,
        });
        await router.replace({ name: "programs.list" });
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : t("programsInvite.acceptFailed");
    } finally {
        isSubmitting.value = false;
    }
}

async function onSignOut() {
    errorMessage.value = "";
    try {
        await authStore.logout();
        await loadPreview();
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : t("programsInvite.acceptFailed");
    }
}

onMounted(() => {
    void loadPreview();
});

watch(token, () => {
    void loadPreview();
});
</script>
