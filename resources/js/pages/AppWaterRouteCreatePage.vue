<template>
    <AppEntityCreatePageLayout
        :title="t('waterRoutesList.createPageTitle')"
        :description="t('waterRoutesList.createPageDescription')"
        :back-to="backTo"
        :back-label="t('waterRoutesList.backToList')"
    >
        <AppCardSection :label="t('waterRoutesList.addNew')">
            <AppWaterRouteForm
                :program-id="programId"
                :water-route-id="null"
                @cancel="onCancel"
                @success="onSuccess"
            />
        </AppCardSection>
    </AppEntityCreatePageLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import AppEntityCreatePageLayout from "../layouts/AppEntityCreatePageLayout.vue";
import AppCardSection from "../components/ui/AppCardSection.vue";
import AppWaterRouteForm from "../components/molecules/AppWaterRouteForm.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const programId = computed(() => String(route.params.programId ?? "").trim());

const backTo = computed(() => ({
    name: "water-routes.list" as const,
    params: { programId: programId.value },
}));

function onCancel(): void {
    void router.push(backTo.value);
}

function onSuccess(payload: { id: string; mode: "create" | "edit" }): void {
    $q.notify({
        type: "positive",
        message:
            payload.mode === "create"
                ? t("waterRoutesList.created")
                : t("waterRoutesList.updated"),
    });
    void router.push(backTo.value);
}
</script>
