<template>
    <AppEntityIndexPageLayout>
        <template #header>
            <AppPageHeader
                :title="t('ticketTypesList.title')"
                :description="t('ticketTypesList.description')"
            >
                <template #actions>
                    <q-btn
                        color="primary"
                        icon="add"
                        :label="t('ticketTypesList.addType')"
                        @click="ticketTypeModalRef?.openCreateModal()"
                    />
                </template>
            </AppPageHeader>
        </template>

        <AppEntityList>
            <AppEmptyListRow
                :show="ticketTypes.length === 0"
                :message="t('ticketTypesList.empty')"
            />
            <q-item
                v-for="row in ticketTypes"
                :key="String(row.id)"
                class="q-pa-md"
            >
                <q-item-section>
                    <q-item-label class="text-h6">{{
                        row.title
                    }}</q-item-label>
                    <q-item-label caption>
                        {{ summaryLine(row) }}
                    </q-item-label>
                </q-item-section>
                <q-item-section side>
                    <div class="column q-gutter-xs items-end">
                        <q-btn
                            color="primary"
                            outline
                            dense
                            :label="t('common.edit')"
                            @click="() => ticketTypeModalRef?.openEditModal(row)"
                        />
                        <q-btn
                            flat
                            dense
                            color="negative"
                            icon="delete"
                            :label="t('ticketTypesList.delete')"
                            @click="() => confirmDelete(row)"
                        />
                    </div>
                </q-item-section>
            </q-item>
        </AppEntityList>

        <AppTicketTypeUpsertModal ref="ticketTypeModalRef" />
    </AppEntityIndexPageLayout>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";
import { useLiveQuery } from "@tanstack/vue-db";
import { eq } from "@tanstack/db";
import { getAppPowerSyncContext } from "../powersync/app-powersync.runtime";
import type { TicketTypeOutput } from "../powersync/ticket-types.collection";

import { useConfirmDialog } from "../composables/useConfirmDialog";
import { useNotifyErrorFromCatch } from "../composables/useNotifyErrorFromCatch";
import AppEntityIndexPageLayout from "../layouts/AppEntityIndexPageLayout.vue";
import AppPageHeader from "../components/ui/AppPageHeader.vue";
import AppEntityList from "../components/ui/AppEntityList.vue";
import AppEmptyListRow from "../components/ui/AppEmptyListRow.vue";
import AppTicketTypeUpsertModal from "../components/organisms/AppTicketTypeUpsertModal.vue";

const powersync = getAppPowerSyncContext();

const { t, locale } = useI18n();
const $q = useQuasar();
const { confirm } = useConfirmDialog();
const { notifyError } = useNotifyErrorFromCatch();

const ticketTypesCollection = powersync.collections.ticket_types;

const { data: ticketTypes } = useLiveQuery(
    (queryBuilder) => {
        const col = ticketTypesCollection.value;
        const pid = powersync.activeProgramIdRef.value.trim();
        if (!col || pid.length === 0) return undefined;
        return queryBuilder
            .from({ tt: col })
            .where(({ tt }) => eq(tt.program_id, pid));
    },
    [ticketTypesCollection, powersync.activeProgramIdRef],
);

const ticketTypeModalRef = ref<InstanceType<
    typeof AppTicketTypeUpsertModal
> | null>(null);

/**
 * @param {TicketTypeOutput} row
 * @returns {string}
 */
function summaryLine(row: TicketTypeOutput): string {
    const parts: string[] = [];
    if (row.is_pay_what_you_can === true) {
        parts.push(t("ticketTypesList.summaryPwyc"));
    } else {
        const cents = row.price_cents;
        if (cents != null && Number.isFinite(Number(cents))) {
            parts.push(
                t("ticketTypesList.summaryPrice", {
                    price: formatPriceCents(cents),
                }),
            );
        } else {
            parts.push("—");
        }
    }
    const min = Number(row.min_per_purchase ?? 0);
    const max = row.max_per_purchase;
    if (max === null || max === undefined) {
        parts.push(
            t("ticketTypesList.summaryMinMaxUnlimited", { min: String(min) }),
        );
    } else {
        parts.push(
            t("ticketTypesList.summaryMinMax", {
                min: String(min),
                max: String(max),
            }),
        );
    }

    const dependsOnId = String(row.depends_on_ticket_type_id ?? "").trim();
    const maxPerReference = row.max_per_reference_ticket;
    if (dependsOnId.length > 0 && maxPerReference != null) {
        const referenceTitle = (ticketTypes.value ?? [])
            .find((candidate) => String(candidate.id ?? "") === dependsOnId)
            ?.title;
        parts.push(
            t("ticketTypesList.summaryDependency", {
                max: String(maxPerReference),
                reference: String(referenceTitle ?? dependsOnId),
            }),
        );
    }

    return parts.join(" · ");
}

/**
 * @param {unknown} cents
 * @returns {string}
 */
function formatPriceCents(cents: unknown): string {
    const n = Number(cents);
    if (!Number.isFinite(n)) {
        return String(cents ?? "");
    }
    return new Intl.NumberFormat(locale.value === "fr" ? "fr-CA" : "en-CA", {
        style: "currency",
        currency: "CAD",
    }).format(n / 100);
}

/**
 * @param {TicketTypeOutput} row
 * @returns {void}
 */
function confirmDelete(row: TicketTypeOutput): void {
    confirm({
        title: t("ticketTypesList.deleteConfirmTitle"),
        message: t("ticketTypesList.deleteConfirmMessage", {
            title: String(row.title ?? ""),
        }),
        onOk: async () => {
            try {
                const col = ticketTypesCollection.value;
                if (!col) return;
                col.delete(String(row.id ?? ""));
                void powersync.refreshOutboxSnapshot();
                $q.notify({
                    type: "positive",
                    message: t("ticketTypesList.deleted"),
                });
            } catch (e) {
                notifyError(e, t("ticketTypesList.errorGeneric"));
            }
        },
    });
}
</script>
