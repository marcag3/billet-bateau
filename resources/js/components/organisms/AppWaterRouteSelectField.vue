<template>
    <AppMapSelect
        :model-value="modelValue"
        :options="optionItems"
        :label="label"
        :disable="disable"
        v-bind="$attrs"
        @update:model-value="onModelValueUpdate"
    >
        <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
                <q-item-section>
                    <q-item-label>{{ opt.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-btn
                        flat
                        round
                        dense
                        icon="edit"
                        @click.stop="() => onRename(opt)"
                    />
                    <q-btn
                        v-if="opt.unused"
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        @click.stop="() => onDelete(opt)"
                    />
                </q-item-section>
            </q-item>
        </template>
        <template #after>
            <q-btn
                flat
                round
                dense
                icon="add"
                @click="openWaterRouteFormCreate"
            />
        </template>
    </AppMapSelect>

    <q-dialog v-model="waterRouteFormDialogOpen" persistent>
        <q-card v-if="waterRouteFormDialogOpen" style="min-width: 320px">
            <q-card-section>
                <div class="text-h6">{{ waterRouteFormDialogTitle }}</div>
            </q-card-section>
            <q-card-section>
                <AppWaterRouteForm
                    :program-id="programId"
                    :water-route-id="waterRouteFormWaterRouteId"
                    @cancel="closeWaterRouteFormDialog"
                    @success="onWaterRouteFormSuccess"
                />
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/vue-db";
import { getAppPowerSyncContext } from "../../powersync/app-powersync.runtime";
import { useNotifyErrorFromCatch } from "../../composables/useNotifyErrorFromCatch";
import { useProgramWaterRoutes } from "../../composables/useProgramWaterRoutes";
import AppMapSelect from "../molecules/AppMapSelect.vue";
import AppWaterRouteForm from "../molecules/AppWaterRouteForm.vue";

const powersync = getAppPowerSyncContext();

const props = defineProps<{
    modelValue: string | null;
    programId: string;
    label: string;
    disable?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string | null): void;
}>();

function onModelValueUpdate(
    value: string | number | null | undefined,
): void {
    if (value == null || value === "") {
        emit("update:modelValue", null);
        return;
    }
    emit("update:modelValue", String(value));
}

const { t } = useI18n();
const $q = useQuasar();
const { notifyError } = useNotifyErrorFromCatch();

const productsCollection = powersync.collections.products;

const programIdRef = toRef(props, "programId");
const { data: waterRoutes } = useProgramWaterRoutes(programIdRef);

const { data: products } = useLiveQuery(
    (queryBuilder) => {
        const col = productsCollection.value;
        const pid = programIdRef.value.trim();
        if (!col || pid.length === 0) {
            return undefined;
        }
        return queryBuilder
            .from({ p: col })
            .where(({ p }) => eq(p.program_id, pid));
    },
    [productsCollection, programIdRef],
);

const usedWaterRouteIds = computed(() => {
    const ids = new Set<string>();
    for (const product of products.value ?? []) {
        const waterRouteId = product.water_route_id;
        if (waterRouteId != null && String(waterRouteId).trim() !== "") {
            ids.add(String(waterRouteId));
        }
    }
    return ids;
});

const optionItems = computed(() =>
    (waterRoutes.value ?? []).map((wr) => ({
        label: String(wr.name ?? ""),
        value: String(wr.id),
        unused: !usedWaterRouteIds.value.has(String(wr.id)),
        id: String(wr.id),
        name: String(wr.name ?? ""),
    })),
);

const waterRouteFormDialogOpen = ref(false);
const waterRouteFormWaterRouteId = ref<string | null>(null);

const waterRouteFormDialogTitle = computed(() =>
    waterRouteFormWaterRouteId.value != null &&
    waterRouteFormWaterRouteId.value.length > 0
        ? t("waterRoutesList.editTitle")
        : t("waterRoutesList.addNew"),
);

function openWaterRouteFormCreate(): void {
    waterRouteFormWaterRouteId.value = null;
    waterRouteFormDialogOpen.value = true;
}

function closeWaterRouteFormDialog(): void {
    waterRouteFormDialogOpen.value = false;
}

function onWaterRouteFormSuccess(payload: {
    id: string;
    mode: "create" | "edit";
}): void {
    closeWaterRouteFormDialog();
    $q.notify({
        type: "positive",
        message:
            payload.mode === "create"
                ? t("waterRoutesList.created")
                : t("waterRoutesList.updated"),
    });
    if (payload.mode === "create") {
        emit("update:modelValue", payload.id);
    }
}

function onRename(opt: { id: string; name: string }): void {
    waterRouteFormWaterRouteId.value = opt.id;
    waterRouteFormDialogOpen.value = true;
}

function onDelete(opt: { id: string; name: string }): void {
    $q.dialog({
        title: t("waterRoutesList.deleteConfirmTitle"),
        message: t("waterRoutesList.deleteConfirmMessage", { name: opt.name }),
        cancel: true,
        persistent: true,
    }).onOk(() => {
        void (async () => {
            try {
                const col = powersync.collections.water_routes.value;
                if (!col) {
                    return;
                }
                col.delete(String(opt.id));
                void powersync.refreshOutboxSnapshot();
                if (props.modelValue === opt.id) {
                    emit("update:modelValue", null);
                }
                $q.notify({
                    type: "positive",
                    message: t("waterRoutesList.deleted"),
                });
            } catch (e) {
                notifyError(e, t("waterRoutesList.errorGeneric"));
            }
        })();
    });
}

watch(
    () => [props.modelValue, optionItems.value] as const,
    ([selected, options]) => {
        const selectedId = selected == null ? "" : String(selected).trim();
        if (selectedId.length === 0) {
            return;
        }
        const exists = options.some((opt) => String(opt.value) === selectedId);
        if (!exists) {
            emit("update:modelValue", null);
        }
    },
    { immediate: true },
);
</script>
