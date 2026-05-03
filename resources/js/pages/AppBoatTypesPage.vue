<template>
    <q-page class="q-pa-xl">
        <AppPageHeader
            :title="t('boatTypesList.title')"
            :description="t('boatTypesList.description')"
        />

        <AppAlertBanner
            v-if="hasOutboxCommitError"
            variant="warning"
            dismissible
            :dismiss-label="t('common.dismiss')"
            @dismiss="dismissOutboxCommitError"
        >
            {{ outboxCommitError }}
        </AppAlertBanner>

        <AppBootstrapGate
            :ready="hasBootstrapped"
            content-class="q-gutter-y-md"
        >
            <AppCardSection :label="t('boatTypesList.addNew')">
                <q-form @submit.prevent="onCreateSubmit">
                    <AppFormStack>
                        <q-input
                            v-model="createName"
                            v-bind="createNameProps"
                            outlined
                            dense
                            :label="t('boatTypesList.name')"
                            :disable="isSubmitting"
                        />
                        <q-btn
                            type="submit"
                            color="primary"
                            :label="t('boatTypesList.create')"
                            :loading="isSubmitting"
                            :disable="!meta.valid || isSubmitting"
                            class="self-start"
                        />
                    </AppFormStack>
                </q-form>
            </AppCardSection>

            <AppEntityList>
                <AppEmptyListRow
                    :show="boatTypes.length === 0"
                    :message="t('boatTypesList.empty')"
                />
                <q-item
                    v-for="bt in boatTypes"
                    :key="bt.id"
                    class="q-pa-md"
                    style="align-items: flex-start"
                >
                    <q-item-section>
                        <q-item-label class="text-h6 q-mb-sm">{{
                            bt.name
                        }}</q-item-label>
                        <q-input
                            :model-value="String(bt.name ?? '')"
                            outlined
                            dense
                            class="q-mb-sm"
                            :label="t('boatTypesList.rename')"
                            :disable="patchingId === bt.id"
                            @update:model-value="(v) => setNameDraft(bt.id, v)"
                            @blur="() => commitName(bt)"
                        />
                        <AppFormRow class="q-mb-sm">
                            <div class="col-12 col-md-6">
                                <div
                                    v-if="primaryImageFor(bt.id)"
                                    class="q-mb-xs"
                                >
                                    <q-img
                                        :src="primaryImageFor(bt.id)"
                                        ratio="16/9"
                                        class="rounded-borders"
                                        style="max-height: 12rem"
                                        fit="cover"
                                    />
                                </div>
                                <q-file
                                    :model-value="null"
                                    outlined
                                    dense
                                    multiple
                                    use-chips
                                    counter
                                    :label="t('boatTypesList.images')"
                                    accept="image/jpeg,image/png,image/webp"
                                    :disable="uploadingId === bt.id"
                                    @update:model-value="
                                        (files) =>
                                            onPickImages(String(bt.id), files)
                                    "
                                />
                            </div>
                        </AppFormRow>
                        <q-btn
                            flat
                            color="negative"
                            icon="delete"
                            :label="t('boatTypesList.delete')"
                            :disable="
                                patchingId === bt.id || uploadingId === bt.id
                            "
                            @click="() => confirmDelete(bt)"
                        />
                    </q-item-section>
                </q-item>
            </AppEntityList>
        </AppBootstrapGate>
    </q-page>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { ulid } from "ulid";
import {
    createBoatTypeFormSchema,
    type BoatTypeFormValues,
} from "../models/boat-types/boat-types.validation";
import { createQuasarFieldBinder } from "../validation/quasar-vee-fields";
import { safeParseBoatEntityName } from "../models/boats/boats.validation";
import {
    getAppPowerSyncBootstrappedRef,
    getBoatTypesCollection,
    getMediaCollection,
    getCurrentUserIdRef,
    refreshOutboxSnapshot,
    useAppPowerSyncOutbox,
} from "../powersync/app-powersync.runtime";
import mediaRoutes from "../routes/api/media";
import { requestFormData } from "../services/http.client";
import { normalizeImageFiles } from "../utilities/image-files";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyAsyncAction } from "../composables/useNotifyAsyncAction";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppAlertBanner from "../components/ui/AppAlertBanner.vue";
import AppBootstrapGate from "../components/ui/AppBootstrapGate.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppFormStack from "../components/ui/AppFormStack.vue";
import AppFormRow from "../components/ui/AppFormRow.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";

const BOAT_TYPE_MODEL = "App\\Models\\BoatType";

const route = useRoute();
const programId = computed(() => String(route.params.programId ?? ""));

const boatTypesCollection = getBoatTypesCollection();

const { data: boatTypes } = useLiveQuery(
    (queryBuilder) => {
        const col = boatTypesCollection.value;
        const pid = programId.value;
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ bt: col })
            .where(({ bt }) => eq(bt.program_id, pid));
    },
    [boatTypesCollection, programId],
);

const { t } = useI18n();
const $q = useQuasar();
const { confirm } = useConfirmDialog();
const { runWithNotify } = useNotifyAsyncAction();
const { notifyError } = useNotifyErrorFromCatch();

const hasBootstrapped = getAppPowerSyncBootstrappedRef();
const { outboxCommitError, hasOutboxCommitError, dismissOutboxCommitError } =
    useAppPowerSyncOutbox();

const mediaCollection = getMediaCollection();
const { data: mediaRows } = useLiveQuery(
    (queryBuilder) => {
        const col = mediaCollection.value;
        const pid = programId.value;
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ m: col })
            .where(({ m }) => eq(m.program_id, pid))
            .orderBy(({ m }) => m.order_column, "asc")
            .orderBy(({ m }) => m.created_at, "asc");
    },
    [mediaCollection, programId],
);

const boatTypeFormSchema = createBoatTypeFormSchema(t);
const { handleSubmit, defineField, meta, isSubmitting, resetForm } =
    useForm<BoatTypeFormValues>({
        validationSchema: boatTypeFormSchema,
        initialValues: {
            name: "",
        } satisfies BoatTypeFormValues,
    });

const quasarField = createQuasarFieldBinder(defineField);
const [createName, createNameProps] = quasarField("name");

const patchingId = ref("");
const uploadingId = ref("");
const nameDrafts = reactive<Record<string, string>>({});

function setNameDraft(id: string, v: unknown) {
    nameDrafts[id] = String(v ?? "");
}

function primaryImageFor(boatTypeId: string) {
    const rows = mediaRows.value ?? [];
    const match = rows.find(
        (m: Record<string, unknown> | null) =>
            m != null &&
            String(m.model_type) === BOAT_TYPE_MODEL &&
            String(m.model_id) === boatTypeId &&
            String(m.collection_name) === "images",
    );
    if (!match || typeof match["name"] !== "string") {
        return undefined;
    }
    const fileName =
        typeof match["file_name"] === "string" ? match["file_name"] : "";
    if (fileName.length === 0) {
        return undefined;
    }
    return `/media/${String(match["uuid"])}`;
}

function commitName(bt: Record<string, unknown>) {
    const id = String(bt.id);
    const next = (nameDrafts[id] ?? String(bt.name ?? "")).trim();
    const current = String(bt.name ?? "").trim();
    if (next === current) {
        return;
    }
    if (next.length === 0) {
        return;
    }
    const parsed = safeParseBoatEntityName(t, next);
    if (!parsed.success) {
        $q.notify({
            type: "negative",
            message:
                parsed.error.issues[0]?.message ?? t("boatsList.nameRequired"),
        });
        return;
    }
    void (async () => {
        patchingId.value = id;
        try {
            const col = boatTypesCollection.value;
            if (!col) return;
            col.update(id, (draft) => {
                draft.name = parsed.data;
                draft.updated_at = new Date().toISOString();
            });
            void refreshOutboxSnapshot();
        } finally {
            patchingId.value = "";
        }
    })();
}

const onCreateSubmit = handleSubmit(async (values: BoatTypeFormValues) => {
    await runWithNotify(
        async () => {
            const col = boatTypesCollection.value;
            if (!col) throw new Error("Boat types collection not ready.");
            const parsedUserId = Number.parseInt(
                getCurrentUserIdRef().value,
                10,
            );
            const userId = Number.isFinite(parsedUserId) ? parsedUserId : null;
            const id = ulid();
            const trimmed = String(values.name ?? "").trim();
            await col.insert({
                id,
                user_id: userId,
                program_id: programId.value,
                name: trimmed.length > 0 ? trimmed : "Untitled",
            }).isPersisted.promise;
            void refreshOutboxSnapshot();
            resetForm();
        },
        {
            successMessage: t("boatTypesList.created"),
            errorGeneric: t("boatTypesList.errorGeneric"),
        },
    );
});

async function onPickImages(
    boatTypeId: string,
    value: File | File[] | null | undefined,
) {
    const files = normalizeImageFiles(value);
    if (files.length === 0) {
        return;
    }
    uploadingId.value = boatTypeId;
    try {
        const formData = new FormData();
        for (const file of files) {
            formData.append("images[]", file);
        }
        await requestFormData(
            mediaRoutes.store.url({ type: "boat_type", id: boatTypeId }),
            formData,
            {
                withCsrf: true,
            },
        );
        $q.notify({
            type: "positive",
            message: t("boatTypesList.imagesUploaded"),
        });
    } catch (e) {
        $q.notify({
            type: "negative",
            message:
                e instanceof Error
                    ? e.message
                    : t("boatTypesList.errorGeneric"),
        });
    } finally {
        uploadingId.value = "";
    }
}

function confirmDelete(bt: Record<string, unknown>) {
    confirm({
        title: t("boatTypesList.deleteConfirmTitle"),
        message: t("boatTypesList.deleteConfirmMessage", {
            name: String(bt.name ?? ""),
        }),
        onOk: async () => {
            try {
                const col = boatTypesCollection.value;
                if (!col) return;
                col.delete(String(bt.id));
                void refreshOutboxSnapshot();
                $q.notify({
                    type: "positive",
                    message: t("boatTypesList.deleted"),
                });
            } catch (e) {
                notifyError(e, t("boatTypesList.errorGeneric"));
            }
        },
    });
}
</script>
