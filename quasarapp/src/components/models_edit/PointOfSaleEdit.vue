<template>
    <ModelEditTemplate
        :model-store="pointsOfSale"
        :model="pointOfSale"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    />
</template>

<script>
    import { ref } from "vue";
    import { usePointsOfSale, PointOfSale } from "../../store/pointsOfSale";
    import { required, maxLength, noRule } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import { useAreas } from "src/store/areas";

    export default {
        name: "PointOfSaleEdit",
        props: { create: Boolean },
        emits: ["updated", "deleted"],
        components: {
            ModelEditTemplate,
        },

        setup(props) {
            const pointsOfSale = usePointsOfSale();
            const pointOfSale = ref();
            const areas = useAreas();

            pointOfSale.value = props.create ? new PointOfSale() : new PointOfSale(pointsOfSale.current);

            const rules = {
                name: { required, maxLength: maxLength(100) },
                is_for_client: { noRule },
                area_id: { noRule },
                square_location_id: { required },
            };

            return {
                pointsOfSale,
                pointOfSale,
                rules,
                fields: [
                    { name: "name", icon: "fas fa-clipboard", component: "MyInput" },
                    { name: "is_for_client", icon: "fab fa-internet-explorer", component: "MyToggle" },
                    { name: "area_id", component: "BasicModelSelect", attributes: { modelStore: areas } },
                    { name: "square_location_id", icon: "satellite", component: "MyInput" },
                ],
            };
        },
    };
</script>
