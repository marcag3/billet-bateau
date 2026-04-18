<template>
    <ModelEditTemplate
        :model-store="areas"
        :model="area"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    />
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { Area, useAreas } from "src/store/areas";
    import { required, telephone, email, noRule, postalCode } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";

    export default {
        components: {
            ModelEditTemplate,
        },
        // name: 'ComponentName',
        props: { create: Boolean },
        emits: ["updated", "deleted"],
        setup(props) {
            const { t } = useI18n(),
                areas = useAreas(),
                area = ref();
            area.value = props.create ? new Area() : new Area(areas.current);

            const rules = computed(() => ({
                name: { required },
                address: { noRule },
                apartment: { noRule },
                city: { noRule },
                postalCode: { postalCode },
                telephone: { telephone },
                email: { email },
            }));
            const phoneMask = "+1 ###-###-#### x#####";

            return {
                t,
                areas,
                area,
                rules,
                fields: [
                    { name: "name", icon: "fas fa-clipboard", component: "MyInput" },
                    {
                        name: "telephone",
                        icon: "fas fa-phone",
                        component: "MyInput",
                        v_mask: phoneMask,
                        attributes: { placeholder: "+1 555-555-5555", type: "tel" },
                    },
                    { name: "address", icon: "fas fa-building", component: "MyInput" },
                    { name: "apartment", icon: "fas fa-door-open", component: "MyInput" },
                    { name: "city", icon: "fas fa-city", component: "MyInput" },
                    {
                        name: "postalCode",
                        v_mask: "A#A #A#",
                        icon: "fas fa-envelope",
                        component: "MyInput",
                        attributes: { placeholder: "H0H 0H0" },
                    },
                    {
                        name: "email",
                        icon: "fas fa-at",
                        component: "MyInput",
                    },
                ],
            };
        },
    };
</script>
