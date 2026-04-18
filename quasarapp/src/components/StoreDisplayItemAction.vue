<template>
    <q-card-section>
        <div v-if="numberInCart && unique" style="padding-right: 1em; padding-left: 1em">
            <div class="text-subtitle1 row bg-grey-4 shadow-1 q-pa-sm rounded-borders">
                {{ t("already_in_cart") }}
            </div>
        </div>
        <div v-else-if="numberInCart" style="padding-right: 1em; padding-left: 1em">
            <div class="row inline no-wrap justify-between items-center bg-grey-4">
                <q-avatar
                    class="cursor-pointer"
                    @click="$emit('remove')"
                    style="margin-left: -0.45em"
                    icon="fas fa-minus"
                    color="negative"
                    text-color="white"
                    size="md"
                />
                <div class="col q-mx-md">
                    {{ numberInCart }}
                </div>
                <q-avatar
                    class="cursor-pointer"
                    @click="$emit('add')"
                    style="margin-right: -0.45em"
                    icon="fas fa-plus"
                    color="positive"
                    text-color="white"
                    size="md"
                />
            </div>
        </div>

        <div v-else>
            <q-btn no-caps unelevated color="primary" @click="$emit('add')" style="max-width: 100%" class="text-body2">
                <div class="ellipsis-3-lines">
                    <q-icon left name="fas fa-cart-plus" />
                    {{ t("add_to_cart") }}
                </div>
            </q-btn>
        </div>
    </q-card-section>
</template>

<script>
    import { useI18n } from "vue-i18n";
    export default {
        // name: 'ComponentName',
        props: {
            numberInCart: Number,
            unique: Boolean,
        },
        emits: ["add", "remove"],

        setup() {
            const { t } = useI18n();
            return {
                t,
            };
        },
    };
</script>
