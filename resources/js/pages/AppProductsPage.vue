<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader :title="t('productsList.title')">
                <template #actions>
                    <q-btn color="primary" icon="add" :label="t('productsList.addProduct')"
                        @click="productModalRef?.openCreateModal()" />
                </template>
            </AppPageHeader>
        </template>

        <AppEntityList>
            <AppEmptyListRow :show="products.length === 0" :message="t('productsList.empty')" />
            <q-item v-for="row in products" :key="String(row.id)" class="p-4">
                <q-item-section v-if="productImageUrl(row).length > 0" avatar>
                    <q-avatar rounded size="48px">
                        <q-img :src="productImageUrl(row)" ratio="1" fit="cover" :alt="t('productsList.image')" />
                    </q-avatar>
                </q-item-section>
                <q-item-section>
                    <q-item-label class="text-h6">{{
                        productTitle(row)
                        }}</q-item-label>
                    <q-item-label caption>
                        {{ productSummary(row) }}
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <div class="column gap-1 items-end">
                        <q-btn color="primary" outline dense :label="t('common.edit')"
                            @click="() => productModalRef?.openEditModal(row)" />
                        <q-btn flat dense color="negative" icon="delete" :label="t('productsList.delete')"
                            @click="() => confirmDelete(row)" />
                    </div>
                </q-item-section>
            </q-item>
        </AppEntityList>

        <AppProductUpsertModal ref="productModalRef" />
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import type { ProductOutput } from "../powersync/products.collection";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import { mediaObjectPublicUrl } from "../utilities/media-url";
import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";
import AppProductUpsertModal from "../components/organisms/AppProductUpsertModal.vue";

interface ProductListRow extends ProductOutput {
    boatTypeName?: string | null;
    waterRouteName?: string | null;
}

const powersync = getAppPowerSyncContext();
const { t } = useI18n();
const $q = useQuasar();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();

const productsCollection = powersync.collections.products;
const boatTypesCollection = powersync.collections.boat_types;
const waterRoutesCollection = powersync.collections.water_routes;

const { data: productsRaw } = useLiveQuery(
    (queryBuilder) => {
        const col = productsCollection.value;
        const btCol = boatTypesCollection.value;
        const wrCol = waterRoutesCollection.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || !btCol || !wrCol || pid.length === 0) {
            return undefined;
        }
        return queryBuilder
            .from({ p: col })
            .leftJoin({ bt: btCol }, ({ p, bt }) => eq(p.boat_type_id, bt.id))
            .leftJoin({ wr: wrCol }, ({ p, wr }) => eq(p.water_route_id, wr.id))
            .where(({ p }) => eq(p.program_id, pid))
            .orderBy(({ p }) => p.id, "desc")
            .select(({ p, bt, wr }) => ({
                ...p,
                boatTypeName: bt.name,
                waterRouteName: wr.name,
            }));
    },
    [
        productsCollection,
        boatTypesCollection,
        waterRoutesCollection,
        powersync.activeProgramIdRef,
    ],
);

const products = computed(() => (productsRaw.value ?? []) as ProductListRow[]);

const productModalRef = ref<InstanceType<typeof AppProductUpsertModal> | null>(null);

function productTitle(row: ProductListRow): string {
    const name = String(row.name ?? "").trim();
    if (name.length === 0) {
        return t("productsList.untitled");
    }
    return name;
}

function productImageUrl(row: ProductListRow): string {
    const key = row.banner_object_key;
    return mediaObjectPublicUrl(
        key == null || String(key).trim() === "" ? null : String(key),
    );
}

function productSummary(row: ProductListRow): string {
    const parts: string[] = [];
    if (row.capacity != null && Number.isFinite(Number(row.capacity))) {
        parts.push(t("productsList.capacityLabel", { cap: Number(row.capacity) }));
    } else {
        parts.push(t("productsList.capacityUnknown"));
    }

    if (row.boatTypeName != null && String(row.boatTypeName).trim() !== "") {
        parts.push(
            t("productsList.boatTypeSummary", {
                value: String(row.boatTypeName),
            }),
        );
    }

    if (row.waterRouteName != null && String(row.waterRouteName).trim() !== "") {
        parts.push(
            t("productsList.waterRouteSummary", {
                value: String(row.waterRouteName),
            }),
        );
    }

    return parts.join(" · ");
}

function confirmDelete(row: ProductListRow): void {
    confirm({
        title: t("productsList.deleteConfirmTitle"),
        message: t("productsList.deleteConfirmMessage", {
            name: productTitle(row),
        }),
        onOk: async () => {
            try {
                const col = productsCollection.value;
                if (!col) {
                    return;
                }
                col.delete(String(row.id ?? ""));
                void powersync.refreshOutboxSnapshot();
                $q.notify({
                    type: "positive",
                    message: t("productsList.deleted"),
                });
            } catch (e) {
                notifyError(e, t("productsList.errorGeneric"));
            }
        },
    });
}
</script>
