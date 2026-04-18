<template>
    <ModelEditTemplate
        :model-store="boatCategories"
        :model="boatCategory"
        :fields="fields"
        :rules="rules"
        @updated="$emit('updated', $event)"
        @deleted="$emit('deleted')"
    >
        <!-- TODO:il y a un truc funky avec l'image, ça serait bien de pas avoir imageFile dans le v-model pour que ça marche avec les autres component -->
        <!-- image -->
        <q-file
            v-model="boatCategory.imageFile"
            :label="t('boat_category_image')"
            filled
            clearable
            @blur="touch('image')"
            :error="v$.image.$error"
            bottom-slots
            accept=".jpg, image/*"
            :max-file-size="100 * 10 ** 9"
            @rejected="rejected"
        >
            <template v-slot:before>
                <q-icon name="fas fa-image" />
            </template>
            <template v-slot:append>
                <q-icon name="search" @click.stop />
            </template>
            <template v-slot:error>
                <template v-for="error of v$.image.$errors" :key="error.$uid">
                    <div v-html="error.$message" class="text-negative"></div>
                </template>
            </template>
        </q-file>
        <q-img v-if="boatCategory.image" :src="boatCategory.image" />
    </ModelEditTemplate>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { ref, computed } from "vue";
    import { BoatCategory, useBoatCategories } from "src/store/boatCategories";
    import { useQuasar } from "quasar";
    import { required, minValue, lessThanTotalCapacity, noRule, maxLength } from "src/utilities/validators";
    import { useActivities } from "src/store/activities";
    import ModelEditTemplate from "src/components/templates/ModelEditTemplate";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";

    export default {
        components: { ModelEditTemplate },
        // name: 'ComponentName',
        props: {
            create: Boolean,
        },
        emits: ["updated", "deleted"],
        setup(props) {
            const { t } = useI18n(),
                boatCategories = useBoatCategories(),
                boatCategory = ref(),
                activities = useActivities(),
                $q = useQuasar();

            boatCategory.value = props.create ? new BoatCategory() : new BoatCategory(boatCategories.current);

            const rules = computed(() => ({
                name: { required },
                total_capacity: { required, minValue: minValue(0) },
                teen_capacity: {
                    required,
                    minValue: minValue(0),
                    lessThanTotalCapacity: lessThanTotalCapacity(boatCategory.value.total_capacity),
                },
                child_capacity: {
                    required,
                    minValue: minValue(0),
                    lessThanTotalCapacity: lessThanTotalCapacity(boatCategory.value.total_capacity),
                },
                minimum_booking_person: {
                    minValue: minValue(1),
                    lessThanTotalCapacity: lessThanTotalCapacity(boatCategory.value.total_capacity),
                },
                description_fr: { maxLength: maxLength(500) },
                description_en: { maxLength: maxLength(500) },
                activity_id: { noRule },
                activity_text_fr: { maxLength: maxLength(1000) },
                activity_text_en: { maxLength: maxLength(1000) },
                image: { noRule },
            }));

            const validations = useServerValidations();
            const v$ = useVuelidate(rules, boatCategory, {
                $externalResults: computed(() => validations.errors),
                $lazy: true,
            });

            return {
                t,
                boatCategories,
                boatCategory,
                activities,
                rules,
                v$,
                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },
                fields: [
                    { name: "name", icon: "fas fa-clipboard", component: "MyInput" },
                    {
                        name: "total_capacity",
                        icon: "fas fa-users",
                        component: "MyInput",
                        // modifier: "number",
                        attributes: { type: "number", min: 0, max: 30 },
                    },
                    {
                        name: "teen_capacity",
                        icon: "fas fa-snowboarding",
                        component: "MyInput",
                        modifier: "number",
                        attributes: { type: "number", min: 0, max: 30 },
                    },
                    {
                        name: "child_capacity",
                        icon: "fas fa-child",
                        component: "MyInput",
                        modifier: "number",
                        attributes: { type: "number", min: 0, max: 30 },
                    },
                    {
                        name: "minimum_booking_person",
                        icon: "fas fa-glass-cheers",
                        component: "MyInput",
                        modifier: "number",
                        attributes: { type: "number", min: 1, max: 30 },
                    },
                    {
                        name: "description_fr",
                        icon: "fas fa-quote-right",
                        component: "MyInput",
                    },
                    {
                        name: "description_en",
                        icon: "fas fa-quote-left",
                        component: "MyInput",
                    },
                    {
                        name: "activity_id",
                        component: "BasicModelSelect",
                        attributes: { modelStore: activities },
                    },
                ],
                rejected() {
                    $q.notify({
                        color: "negative",
                        icon: "fas fa-exclamation",
                        message: t("image_rejected"),
                    });
                },
            };
        },
    };
</script>
