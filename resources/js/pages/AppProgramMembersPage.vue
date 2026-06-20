<template>
    <q-page class="p-4">
        <AppPageHeader :title="t('programsMembers.title')" />

        <AppAlertBanner
            v-if="hasBootstrapped && !isOwner"
            variant="info"
        >
            {{ t("programsMembers.notOwner") }}
        </AppAlertBanner>

        <template v-else-if="isOwner">
            <AppAlertBanner v-if="loadError.length > 0" variant="error">
                {{ loadError }}
            </AppAlertBanner>

            <AppCardSection
                :label="t('programsMembers.inviteSectionTitle')"
                class="mt-4"
            >
                <p class="text-body2 text-grey-8">
                    {{ t("programsMembers.inviteSectionSubtitle") }}
                </p>
                <q-form class="column gap-4" @submit.prevent="onInviteSubmit">
                    <AppAlertBanner v-if="inviteError.length > 0" variant="error">
                        {{ inviteError }}
                    </AppAlertBanner>
                    <AppAlertBanner v-if="inviteSuccess" variant="info">
                        {{ t("programsInvite.inviteSent") }}
                    </AppAlertBanner>
                    <q-input
                        v-model="inviteEmail"
                        type="email"
                        outlined
                        :label="t('programsInvite.emailLabel')"
                        :disable="inviteSubmitting || loading"
                        autocomplete="off"
                    />
                    <q-btn
                        color="primary"
                        type="submit"
                        class="self-start"
                        :loading="inviteSubmitting"
                        :disable="inviteSubmitting || loading"
                        :label="t('programsInvite.sendInvite')"
                    />
                </q-form>
            </AppCardSection>

            <AppCardSection
                :label="t('programsMembers.pendingSectionTitle')"
                class="mt-6"
            >
                <AppEntityList>
                    <AppEmptyListRow
                        :show="!loading && pendingInvitations.length === 0"
                        :message="t('programsMembers.pendingEmpty')"
                    />
                    <q-item
                        v-for="invitation in pendingInvitations"
                        :key="invitation.id"
                        class="p-4"
                    >
                        <q-item-section>
                            <div
                                class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div class="min-w-0">
                                    <q-item-label class="text-h6 break-all">{{
                                        invitation.email
                                    }}</q-item-label>
                                    <q-item-label caption>
                                        {{
                                            t("programsMembers.expiresLabel", {
                                                date: formatDateTime(
                                                    invitation.expires_at,
                                                ),
                                            })
                                        }}
                                    </q-item-label>
                                </div>
                                <q-btn
                                    flat
                                    dense
                                    color="negative"
                                    class="w-full shrink-0 sm:w-auto"
                                    :label="t('programsMembers.revokeInvite')"
                                    :disable="
                                        loading || actionUserId.length > 0
                                    "
                                    @click="
                                        () => confirmRevokeInvite(invitation)
                                    "
                                />
                            </div>
                        </q-item-section>
                    </q-item>
                </AppEntityList>
            </AppCardSection>

            <AppCardSection
                :label="t('programsMembers.membersSectionTitle')"
                class="mt-6"
            >
                <AppEntityList>
                    <AppEmptyListRow
                        :show="!loading && members.length === 0"
                        :message="t('programsMembers.membersEmpty')"
                    />
                    <q-item
                        v-for="member in members"
                        :key="member.user_id"
                        class="p-4"
                    >
                        <q-item-section>
                            <div
                                class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                            >
                                <div class="min-w-0 flex-grow">
                                    <q-item-label class="text-h6 break-words">{{
                                        member.name
                                    }}</q-item-label>
                                    <q-item-label caption class="break-all">{{
                                        member.email
                                    }}</q-item-label>
                                </div>
                                <div
                                    class="flex flex-col gap-2 shrink-0 sm:items-end"
                                >
                                    <q-badge
                                        class="self-start sm:self-end"
                                        :color="
                                            member.role === 'owner'
                                                ? 'primary'
                                                : 'grey-7'
                                        "
                                        :label="roleLabel(member.role)"
                                    />
                                    <template v-if="member.role === 'admin'">
                                        <q-btn
                                            color="primary"
                                            outline
                                            dense
                                            class="w-full sm:w-auto"
                                            :label="
                                                t(
                                                    'programsMembers.transferOwnership',
                                                )
                                            "
                                            :loading="
                                                actionUserId ===
                                                    member.user_id &&
                                                actionType === 'transfer'
                                            "
                                            :disable="
                                                loading ||
                                                (actionUserId.length > 0 &&
                                                    actionUserId !==
                                                        member.user_id)
                                            "
                                            @click="
                                                () => confirmTransfer(member)
                                            "
                                        />
                                        <q-btn
                                            flat
                                            dense
                                            color="negative"
                                            class="w-full sm:w-auto"
                                            :label="
                                                t(
                                                    'programsMembers.removeAccess',
                                                )
                                            "
                                            :loading="
                                                actionUserId ===
                                                    member.user_id &&
                                                actionType === 'remove'
                                            "
                                            :disable="
                                                loading ||
                                                (actionUserId.length > 0 &&
                                                    actionUserId !==
                                                        member.user_id)
                                            "
                                            @click="() => confirmRemove(member)"
                                        />
                                    </template>
                                </div>
                            </div>
                        </q-item-section>
                    </q-item>
                </AppEntityList>
            </AppCardSection>
        </template>
    </q-page>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useCurrentProgramMembershipRole } from "../composables/useCurrentProgramMembershipRole";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";
import { sendProgramAdminInvitation } from "../models/programs/program-invitations.api";
import {
    fetchProgramMembership,
    removeProgramMember,
    revokeProgramInvitation,
    transferProgramOwnership,
    type ProgramMember,
    type ProgramPendingInvitation,
} from "../models/programs/program-membership.api";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();
const powersync = getAppPowerSyncContext();
const programId = computed(() => String(route.params.programId ?? "").trim());
const hasBootstrapped = powersync.hasBootstrappedCollection;

const { isOwner, role: membershipRole } =
    useCurrentProgramMembershipRole(programId);

const loading = ref(false);
const loadError = ref("");
const members = ref<ProgramMember[]>([]);
const pendingInvitations = ref<ProgramPendingInvitation[]>([]);

const inviteEmail = ref("");
const inviteSubmitting = ref(false);
const inviteError = ref("");
const inviteSuccess = ref(false);

const actionUserId = ref("");
const actionType = ref<"remove" | "transfer" | "">("");

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString(locale.value);
}

function roleLabel(role: string): string {
    if (role === "owner") {
        return t("programsMembers.roleOwner");
    }
    return t("programsMembers.roleAdmin");
}

async function loadMembership(): Promise<void> {
    const id = programId.value;
    if (id.length === 0 || !isOwner.value) {
        return;
    }

    loading.value = true;
    loadError.value = "";
    try {
        const data = await fetchProgramMembership(id);
        members.value = data.members;
        pendingInvitations.value = data.pending_invitations;
    } catch (error) {
        loadError.value =
            error instanceof Error
                ? error.message
                : t("programsMembers.loadFailed");
    } finally {
        loading.value = false;
    }
}

watch(
    () => membershipRole.value,
    () => {
        if (hasBootstrapped.value && isOwner.value) {
            void loadMembership();
        }
    },
);

watch(
    [programId, isOwner, hasBootstrapped],
    () => {
        inviteSuccess.value = false;
        inviteError.value = "";
        if (hasBootstrapped.value && isOwner.value) {
            void loadMembership();
        }
    },
    { immediate: true },
);

function onDocumentVisibilityChange(): void {
    if (
        document.visibilityState === "visible" &&
        hasBootstrapped.value &&
        isOwner.value
    ) {
        void loadMembership();
    }
}

onMounted(() => {
    document.addEventListener("visibilitychange", onDocumentVisibilityChange);
});

onUnmounted(() => {
    document.removeEventListener("visibilitychange", onDocumentVisibilityChange);
});

async function onInviteSubmit(): Promise<void> {
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
        await loadMembership();
    } catch (error) {
        inviteError.value =
            error instanceof Error
                ? error.message
                : t("programsInvite.sendFailed");
    } finally {
        inviteSubmitting.value = false;
    }
}

function confirmRevokeInvite(invitation: ProgramPendingInvitation): void {
    confirm({
        title: t("programsMembers.revokeInviteConfirmTitle"),
        message: t("programsMembers.revokeInviteConfirmMessage", {
            email: invitation.email,
        }),
        onOk: async () => {
            const id = programId.value;
            if (id.length === 0) {
                return;
            }
            try {
                await revokeProgramInvitation(id, invitation.id);
                $q.notify({
                    type: "positive",
                    message: t("programsMembers.revokeInviteSuccess"),
                });
                await loadMembership();
            } catch (error) {
                notifyError(error, t("programsMembers.revokeInviteFailed"));
            }
        },
    });
}

function confirmRemove(member: ProgramMember): void {
    confirm({
        title: t("programsMembers.removeConfirmTitle"),
        message: t("programsMembers.removeConfirmMessage", {
            name: member.name,
        }),
        onOk: async () => {
            const id = programId.value;
            if (id.length === 0) {
                return;
            }
            actionUserId.value = member.user_id;
            actionType.value = "remove";
            try {
                await removeProgramMember(id, member.user_id);
                $q.notify({
                    type: "positive",
                    message: t("programsMembers.removeSuccess"),
                });
                await loadMembership();
            } catch (error) {
                notifyError(error, t("programsMembers.removeFailed"));
            } finally {
                actionUserId.value = "";
                actionType.value = "";
            }
        },
    });
}

function confirmTransfer(member: ProgramMember): void {
    confirm({
        title: t("programsMembers.transferConfirmTitle"),
        message: t("programsMembers.transferConfirmMessage", {
            name: member.name,
        }),
        onOk: async () => {
            const id = programId.value;
            if (id.length === 0) {
                return;
            }
            actionUserId.value = member.user_id;
            actionType.value = "transfer";
            try {
                await transferProgramOwnership(id, member.user_id);
                $q.notify({
                    type: "positive",
                    message: t("programsMembers.transferSuccess"),
                });
                await router.push({
                    name: "programs.edit",
                    params: { programId: id },
                });
            } catch (error) {
                notifyError(error, t("programsMembers.transferFailed"));
            } finally {
                actionUserId.value = "";
                actionType.value = "";
            }
        },
    });
}
</script>
