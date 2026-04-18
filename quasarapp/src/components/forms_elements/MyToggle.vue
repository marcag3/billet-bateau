<template>
    <div class="row no-wrap">
        <div v-if="!!icon" class="q-field__before q-field__marginal row no-wrap items-center">
            <q-icon :name="icon" />
        </div>
        <div class="col">
            <q-toggle
                :model-value="modelValue"
                @update:modelValue="$emit('update:modelValue', $event), $emit('blur')"
                :label="label"
                v-bind="$props"
                unchecked-icon="clear"
                checked-icon="check"
                icon=""
                :toggle-indeterminate="toggleIndeterminate ?? false"
                :dense="dense"
            />
            <div class="q-field__bottom row items-start">
                <template v-for="error of validation.$errors" :key="error.$uid">
                    <div v-html="error.$message" class="text-negative q-field__messages col"></div>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        // name: 'ComponentName',
        props: {
            modelValue: Boolean,
            label: String,
            icon: String,
            validation: Object,
            toggleIndeterminate: Boolean,
            dense: Boolean,
        },
        emits: ["update:modelValue", "blur"],
        setup() {
            return {};
        },
    };
</script>
