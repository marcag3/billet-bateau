<template>
    <ModelEditTemplate
        :model-store="activities"
        :model="activity"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    />
</template>

<script>
    import { ref } from "vue";
    import { useActivities, Activity } from "../../store/activities";
    import { required, maxLength } from "src/utilities/validators";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";

    export default {
        name: "ActivityEdit",
        props: { create: Boolean },
        emits: ["updated", "deleted"],
        components: {
            ModelEditTemplate,
        },

        setup(props) {
            const activities = useActivities();
            const activity = ref();

            activity.value = props.create ? new Activity() : new Activity(activities.current);

            const rules = {
                name: { required, maxLength: maxLength(255) },
                description_fr: { maxLength: maxLength(1000) },
                description_en: { maxLength: maxLength(1000) },
                rules_fr: { maxLength: maxLength(3000) },
                rules_en: { maxLength: maxLength(3000) },
            };

            return {
                activities,
                activity,
                rules,
                fields: [
                    { name: "name", icon: "fas fa-clipboard", component: "MyInput" },
                    { name: "description_fr", icon: "fas fa-quote-right", component: "MyInput" },
                    { name: "description_en", icon: "fas fa-quote-left", component: "MyInput" },
                    { name: "rules_fr", icon: "fas fa-clipboard", component: "MyInput" },
                    { name: "rules_en", icon: "fas fa-clipboard", component: "MyInput" },
                ],
            };
        },
    };
</script>
