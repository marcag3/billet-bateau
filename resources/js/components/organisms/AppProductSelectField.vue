<template>
    <AppMapSelect
        :model-value="modelValue"
        :options="optionItems"
        :label="label"
        :disable="disable"
        filterable
        v-bind="$attrs"
        @update:model-value="onModelValueUpdate"
    />
</template>

<script setup lang="ts">
import { computed, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useProgramProducts } from "../../composables/useProgramProducts";
import AppMapSelect from "../molecules/AppMapSelect.vue";

const props = defineProps<{
    modelValue: string | null;
    programId: string;
    label: string;
    disable?: boolean;
}>();

const emit = defineEmits<{
    (e: "update:modelValue", value: string | null): void;
}>();

const { t } = useI18n();

function onModelValueUpdate(value: string | number | null | undefined): void {
    if (value == null || value === "") {
        emit("update:modelValue", null);
        return;
    }
    emit("update:modelValue", String(value));
}

const programIdRef = toRef(props, "programId");
const { data: products } = useProgramProducts(programIdRef);

const optionItems = computed(() =>
    (products.value ?? []).map((product) => {
        const capacity = product.capacity;
        const capacityLabel =
            capacity != null && Number.isFinite(Number(capacity))
                ? t("productsList.capacityLabel", { cap: Number(capacity) })
                : t("productsList.capacityUnknown");

        const name = String(product.name ?? "").trim();
        return {
            label:
                name.length > 0
                    ? `${name} · ${capacityLabel}`
                    : `${t("productsList.untitled")} · ${capacityLabel}`,
            value: String(product.id),
        };
    }),
);

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
