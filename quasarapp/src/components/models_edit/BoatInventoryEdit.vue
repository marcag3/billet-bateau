<template>
    <ModelEditTemplate
        :model-store="boatInventories"
        :model="boatInventory"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { useBoatInventories, BoatInventory } from "../../store/boatInventories";
    import { useBoatCategories } from "src/store/boatCategories";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";
    import { required, minValue } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";

    export default {
        name: "BoatInventoryEdit",
        props: {
            create: Boolean,
        },
        emits: ["updated", "deleted"],
        components: { ModelEditTemplate },

        setup(props) {
            const { t } = useI18n();
            const boatInventories = useBoatInventories();
            const boatInventory = ref();
            const boatCategories = useBoatCategories();

            boatInventory.value = props.create ? new BoatInventory() : new BoatInventory(boatInventories.current);

            const validations = useServerValidations();
            const rules = {
                name: { required },
                boat_category_id: { required },
                quantity: { required, minValue: minValue(0) },
            };

            const v$ = useVuelidate(rules, boatInventory, {
                $externalResults: computed(() => validations.errors),
                $lazy: true,
            });

            return {
                t,
                boatInventories,
                boatInventory,
                boatCategories,
                rules,
                fields: [
                    { name: "name", icon: "fas fa-clipboard", component: "MyInput" },
                    {
                        name: "boat_category_id",
                        component: "BasicModelSelect",
                        attributes: {
                            modelStore: boatCategories,
                            disable: !props.create,
                        },
                    },
                    {
                        name: "quantity",
                        icon: "fas fa-cubes",
                        component: "MyInput",
                        modifier: "number",
                        label: t("quantity"),
                        attributes: { type: "number", min: 0 },
                    },
                ],
            };
        },
    };
</script>
