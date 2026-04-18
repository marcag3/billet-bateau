<template>
    <div>
        <div class="row items-center">
            <div v-if="label" class="col-shrink text-subtitle1">
                <div class="row no-wrap items-center q-mr-lg">
                    <div class="q-field__before q-field__marginal row items-center">
                        <q-icon :name="icon" />
                    </div>
                    {{ label }}
                </div>
            </div>
            <div v-else class="q-field__before q-field__marginal row items-center">
                <q-icon :name="icon" />
            </div>

            <q-btn-toggle
                :class="{ 'col-xs-12': label, 'col-sm-6': label }"
                :model-value="modelValue"
                @update:modelValue="$emit('update:modelValue', $event), $emit('blur')"
                toggle-color="accent"
                :size="$q.screen.lt.sm ? 'sm' : 'md'"
                clearable
                :options="options"
                spread
                :readonly="disable"
                :disable="disable"
                v-bind="$attrs"
            />
        </div>
        <!--  -->
        <div class="q-field__bottom row items-start" v-if="validation">
            <template v-for="error of validation.$errors" :key="error.$uid">
                <div v-html="error.$message" class="text-negative q-field__messages col"></div>
            </template>
        </div>
    </div>
</template>

<script>
    export default {
        // name: 'ComponentName',
        inheritAttrs: false,
        props: {
            modelValue: Number,
            options: Array,
            icon: String,
            validation: Object,
            label: String,
            disable: Boolean,
        },
        emits: ["update:modelValue", "blur"],
        setup() {
            return {};
        },
    };
</script>
