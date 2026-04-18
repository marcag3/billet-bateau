<template>
    <q-dialog :model-value="true" :maximized="$q.screen.lt.sm">
        <q-card scroll ref="scrollable">
            <q-card-section class="row">
                <div class="text-h6">
                    {{
                        model.id
                            ? t("edit_" + modelStore.snakeCaseName) + " : " + model.displayName
                            : t("create_" + modelStore.snakeCaseName)
                    }}
                </div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup size="sm" />
            </q-card-section>
            <q-form @submit="save">
                <ModelEditFields :model="model" :fields="fields" :validations="v$">
                    <slot></slot>
                </ModelEditFields>
                <q-card-actions align="right">
                    <q-btn v-if="model.id" flat :label="t('delete')" color="negative" @click="destroy" />
                    <q-space></q-space>
                    <q-btn flat :label="t('cancel')" color="dark" v-close-popup />
                    <q-btn flat :label="model.id ? t('save') : t('create')" color="positive" type="submit" />
                </q-card-actions>
            </q-form>
        </q-card>
    </q-dialog>
</template>

<script>
    import { scroll, useQuasar } from "quasar";
    import { useI18n } from "vue-i18n";
    import { ref, computed, onMounted } from "vue";
    import ModelEditFields from "src/components/templates/ModelEditFields.vue";
    import { useServerValidations } from "src/store/serverValidations";
    import useVuelidate from "@vuelidate/core";

    const { setVerticalScrollPosition } = scroll;

    export default {
        // name: 'ComponentName',
        props: {
            model: Object,
            modelStore: Object,
            fields: Array,
            rules: Object,
        },
        emits: ["updated", "deleted"],
        components: {
            ModelEditFields,
        },

        setup(props, { emit }) {
            const { t } = useI18n();
            const $q = useQuasar();
            const scrollable = ref();
            const validations = useServerValidations();

            const v$ = useVuelidate(
                computed(() => props.rules),
                props.model,
                {
                    $externalResults: computed(() => validations.errors),
                    $lazy: true,
                }
            );

            function scrollTop() {
                setVerticalScrollPosition(scrollable.value.$el, 0, 500);
            }

            return {
                t,
                v$,
                scrollable,
                save() {
                    v$.value.$touch();
                    if (v$.value.$error) {
                        scrollTop();
                        return;
                    }

                    async function request() {
                        if (props.model.id) {
                            return await props.modelStore.update(props.model);
                        } else {
                            return await props.modelStore.store(props.model);
                        }
                    }
                    request()
                        .then((updatedModel) => {
                            emit("updated", updatedModel);
                            $q.notify({
                                color: "positive",
                                icon: "cloud_done",
                                message: t("saved"),
                            });
                        })
                        .catch((e) => {
                            console.log(e);
                            scrollTop();
                        });
                },
                destroy() {
                    props.modelStore.delete(props.model).then(() => {
                        $q.notify({
                            color: "positive",
                            icon: "cloud_done",
                            message: t("deleted"),
                        });
                        emit("deleted");
                    });
                },
            };
        },
    };
</script>
