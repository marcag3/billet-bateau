<template>
    <q-input filled :error="!!validation ? validation.$error : false" bottom-slots>
        <template v-slot:before v-if="!!icon">
            <q-icon :name="icon" />
        </template>
        <template v-slot:error>
            <template v-for="error of validation.$errors" :key="error.$uid">
                <div v-html="error.$message" class="text-negative"></div>
            </template>
        </template>
    </q-input>
</template>

<script>
    export default {
        // name: 'ComponentName',
        props: { validation: Object, icon: String },
        setup() {
            return {};
        },
    };
</script>
