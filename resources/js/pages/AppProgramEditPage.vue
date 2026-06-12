<template>
    <q-page class="q-pa-md">
        <AppPageHeader :title="t('programsEdit.title')" />

        <AppAlertBanner v-if="showNotFound" variant="error">
            {{ t("programsEdit.notFound") }}
            <div class="q-mt-sm">
                <q-btn color="primary" outline :label="t('programsEdit.backToList')" :to="{ name: 'programs.list' }" />
            </div>
        </AppAlertBanner>

        <AppCardSection v-else :label="t('programsCreate.formSection')">
            <AppAlertBanner v-if="errorMessage.length > 0" variant="error">
                {{ errorMessage }}
            </AppAlertBanner>

            <AppProgramForm
                mode="edit"
                :program-id="programId"
                :seed="formSeed"
                :booking-question-seed="bookingQuestionSeed"
                :existing-banner-url="currentProgramBannerUrl"
                :disabled="showNotFound"
                :submit-fn="onUpdateProgram"
                @submitted="onProgramUpdated"
                @banner-uploaded="onBannerUploaded"
            >
                <template #actions="{ isSubmitting: formSubmitting, fieldsDisabled }">
                    <div class="row q-gutter-sm">
                        <q-btn
                            color="primary"
                            type="submit"
                            :loading="formSubmitting"
                            :disable="fieldsDisabled || showNotFound || isDeleting"
                            :label="t('programsEdit.submit')"
                        />
                        <q-btn
                            flat
                            color="negative"
                            icon="delete"
                            :label="t('programsEdit.delete')"
                            :disable="formSubmitting || fieldsDisabled || showNotFound || isDeleting"
                            @click="confirmDelete"
                        />
                    </div>
                </template>
            </AppProgramForm>
        </AppCardSection>

        <AppCardSection v-if="hasBootstrapped && canInviteAdmins && !showNotFound"
            :label="t('programsInvite.editSectionTitle')" class="q-mt-lg">
            <p class="text-body2 text-grey-8">
                {{ t("programsInvite.editSectionSubtitle") }}
            </p>
            <q-form class="q-gutter-md" @submit.prevent="onInviteSubmit">
                <AppAlertBanner v-if="inviteError.length > 0" variant="error">
                    {{ inviteError }}
                </AppAlertBanner>
                <AppAlertBanner v-if="inviteSuccess" variant="info">
                    {{ t("programsInvite.inviteSent") }}
                </AppAlertBanner>
                <q-input v-model="inviteEmail" type="email" outlined :label="t('programsInvite.emailLabel')"
                    :disable="inviteSubmitting" autocomplete="off" />
                <q-btn color="primary" type="submit" :loading="inviteSubmitting" :disable="inviteSubmitting"
                    :label="t('programsInvite.sendInvite')" />
            </q-form>
        </AppCardSection>

        <AppAlertBanner v-else-if="hasBootstrapped && !canInviteAdmins && !showNotFound" variant="info" class="q-mt-lg">
            {{ t("programsInvite.notOwner") }}
        </AppAlertBanner>
    </q-page>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { computed, ref, watch } from "vue";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import type { ProgramEditFormValues } from "../models/programs/programs.validation";
import {
    programToFormValues,
    toProgramDraftPatch,
} from "../models/programs/program-form";
import type { ProgramFormSubmitPayload } from "../models/programs/program-form";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import type { ProgramOutput } from "../powersync/programs.collection";
import type { ProgramUserOutput } from "../powersync/program-user.collection";
import { programBannerPreviewUrlFromObjectKey } from "../utilities/program-banner-url";
import { parseProgramBookingQuestions } from "../utilities/program-booking-questions";
import { canInviteProgramAdmins } from "../utilities/program-membership";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppProgramForm from "../components/molecules/AppProgramForm.vue";
import {
    sendProgramAdminInvitation,
} from "../models/programs/program-invitations.api";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();
const powersync = getAppPowerSyncContext();
const programsCollection = powersync.collections.programs;
const programUsersCollection = powersync.collections.program_user;
const programId = computed(() => String(route.params.programId ?? "").trim());

const { data: programs } = useLiveQuery(
    (queryBuilder) => {
        const col = programsCollection.value;
        const pid = programId.value;
        if (!col || pid.length === 0) return undefined;
        return queryBuilder.from({ p: col }).where(({ p }) => eq(p.id, pid));
    },
    [programsCollection, programId],
);

const { data: programMemberships } = useLiveQuery(
    (queryBuilder) => {
        const col = programUsersCollection.value;
        const pid = programId.value;
        if (!col || pid.length === 0) return undefined;
        return queryBuilder.from({ m: col }).where(({ m }) => eq(m.program_id, pid));
    },
    [programUsersCollection, programId],
);

const errorMessage = ref("");
const isDeleting = ref(false);

const inviteEmail = ref("");
const inviteSubmitting = ref(false);
const inviteError = ref("");
const inviteSuccess = ref(false);

const hasBootstrapped = powersync.hasBootstrappedCollection;
const currentProgram = computed<ProgramOutput | null>(() => {
    const id = programId.value;
    if (id.length === 0) {
        return null;
    }
    const row = (programs.value ?? []).find((candidateRow) => {
        if (candidateRow == null) {
            return false;
        }
        const candidate = candidateRow as unknown as ProgramOutput;
        return String(candidate.id) === id;
    });
    return row ? (row as unknown as ProgramOutput) : null;
});

const currentMembershipRole = computed((): string | null => {
    const row = (programMemberships.value ?? []).find((candidateRow) => {
        if (candidateRow == null) {
            return false;
        }
        const membership = candidateRow as unknown as ProgramUserOutput;
        return String(membership.program_id) === programId.value;
    });
    if (row == null) {
        return null;
    }
    const membership = row as unknown as ProgramUserOutput;
    return membership.role ?? null;
});

const canInviteAdmins = computed(() =>
    canInviteProgramAdmins(currentMembershipRole.value),
);

const showNotFound = computed(() => {
    if (!hasBootstrapped.value) {
        return false;
    }
    const id = programId.value;
    if (id.length === 0) {
        return true;
    }
    return currentProgram.value == null;
});

const currentProgramBannerUrlRemote = ref("");
const currentProgramBannerUrlFromReplica = computed(() => {
    const p = currentProgram.value;
    if (p == null) {
        return "";
    }
    return programBannerPreviewUrlFromObjectKey(p.banner_object_key);
});
const currentProgramBannerUrl = computed(() => {
    const remoteUrl = currentProgramBannerUrlRemote.value;
    if (remoteUrl.length > 0) {
        return remoteUrl;
    }
    return currentProgramBannerUrlFromReplica.value;
});

const formSeed = computed((): ProgramEditFormValues | null => {
    const p = currentProgram.value;
    if (p == null) {
        return null;
    }
    return programToFormValues(p);
});

const bookingQuestionSeed = computed((): string[] | null => {
    const p = currentProgram.value;
    if (p == null) {
        return null;
    }
    const parsed = parseProgramBookingQuestions(p.booking_questions);
    return parsed.length > 0 ? parsed : [""];
});

watch(programId, () => {
    inviteSuccess.value = false;
    inviteError.value = "";
    currentProgramBannerUrlRemote.value = "";
});

function onBannerUploaded(publicUrl: string): void {
    currentProgramBannerUrlRemote.value = publicUrl;
}

async function onInviteSubmit() {
    inviteError.value = "";
    inviteSuccess.value = false;

    const id = programId.value;
    const email = inviteEmail.value.trim();
    if (id.length === 0) {
        return;
    }
    if (email.length === 0) {
        inviteError.value = t("programsInvite.invalidEmail");
        return;
    }

    inviteSubmitting.value = true;
    try {
        await sendProgramAdminInvitation(id, email);
        inviteSuccess.value = true;
        inviteEmail.value = "";
    } catch (error) {
        inviteError.value =
            error instanceof Error
                ? error.message
                : t("programsInvite.sendFailed");
    } finally {
        inviteSubmitting.value = false;
    }
}

async function onUpdateProgram({
    values,
    bookingQuestions,
}: ProgramFormSubmitPayload): Promise<string> {
    errorMessage.value = "";

    const id = programId.value;
    if (id.length === 0 || showNotFound.value) {
        throw new Error(t("programsEdit.notFound"));
    }

    try {
        const col = programsCollection.value;
        if (!col) {
            throw new Error("Programs collection is not ready.");
        }

        const formValues = values as ProgramEditFormValues;
        const patch = toProgramDraftPatch(formValues, bookingQuestions);

        col.update(id, (draft) => {
            Object.assign(draft, patch);
        });

        void powersync.refreshOutboxSnapshot();

        return id;
    } catch (error) {
        errorMessage.value =
            error instanceof Error ? error.message : String(error);
        throw error;
    }
}

function onProgramUpdated(): void {
    $q.notify({ type: "positive", message: t("programsEdit.success") });
}

function confirmDelete(): void {
    const program = currentProgram.value;
    if (program == null) {
        return;
    }

    confirm({
        title: t("programsEdit.deleteConfirmTitle"),
        message: t("programsEdit.deleteConfirmMessage", {
            name: String(program.name ?? ""),
        }),
        onOk: async () => {
            const id = programId.value;
            if (id.length === 0) {
                return;
            }

            isDeleting.value = true;
            try {
                const col = programsCollection.value;
                if (!col) {
                    throw new Error("Programs collection is not ready.");
                }

                col.delete(id);
                void powersync.refreshOutboxSnapshot();

                $q.notify({
                    type: "positive",
                    message: t("programsEdit.deleted"),
                });
                await router.push({ name: "programs.list" });
            } catch (error) {
                notifyError(error, t("programsEdit.errorGeneric"));
            } finally {
                isDeleting.value = false;
            }
        },
    });
}
</script>
