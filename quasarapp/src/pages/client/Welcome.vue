<template>
    <q-card class="splash-box no-margin no-border-radius">
        <q-card-section class="text-h6">
            {{ t("welcome_message") }}
        </q-card-section>
        <q-form class="col" @submit="onSubmit">
            <q-card-section>
                <!-- email -->
                <q-input
                    filled
                    v-model="clients.current.email"
                    @blur="touch('email')"
                    :label="t('email')"
                    type="email"
                    no-error-icon
                    bottom-slots
                    :error="v$.email.$error"
                >
                    <template v-slot:before>
                        <q-icon name="fas fa-at" />
                    </template>
                    <template v-slot:error>
                        <template v-for="error of v$.email.$errors" :key="error.$uid">
                            <div v-html="error.$message" class="text-negative"></div>
                        </template>
                    </template>
                </q-input>

                <!-- name for bots -->
                <div style="display: none">
                    <q-input filled v-model="name" :label="t('name')" no-error-icon> </q-input>
                </div>
            </q-card-section>
            <q-card-actions class="row justify-around">
                <q-btn
                    :ripple="{ center: true }"
                    color="white"
                    text-color="dark"
                    unelevated
                    outline
                    class="no-border-radius"
                    icon="fas fa-user-plus"
                    :label="t('register')"
                    @click="register"
                />
                <q-btn
                    style="margin-left: 0"
                    :ripple="{ center: true }"
                    color="primary"
                    unelevated
                    class="no-border-radius"
                    icon="fas fa-key"
                    :label="t('login')"
                    type="submit"
                />
            </q-card-actions>
        </q-form>
    </q-card>
</template>

<script>
    import { useServerValidations } from "src/store/serverValidations";
    import { defineComponent, ref, computed } from "vue";
    import { useI18n } from "vue-i18n";
    import { useRouter } from "vue-router";
    import { useClients } from "../../store/clients";
    import useVuelidate from "@vuelidate/core";
    import { required, email } from "../../utilities/validators";

    export default defineComponent({
        name: "welcome",

        setup() {
            const { t } = useI18n();
            const router = useRouter();
            const clients = useClients();
            const name = ref("");

            const validations = useServerValidations();
            const rules = {
                email: { required, email },
            };

            const v$ = useVuelidate(
                rules,
                computed(() => clients.current),
                { $externalResults: computed(() => validations.errors), $lazy: true }
            );

            return {
                clients,
                t,
                name,
                v$,
                validations,
                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },
                onSubmit() {
                    v$.value.$touch;

                    if (v$.value.$error) return;

                    clients
                        .requestPassPhrase(name.value)
                        .then((response) => {
                            if (response.data == "continue") router.push({ name: "client.login" });
                        })
                        .catch(() => {});
                },
                register() {
                    v$.value.$touch();
                    validations.errors = {};
                    if (v$.value.$error) return;

                    clients
                        .register(name.value)
                        .then((response) => {
                            if (response.data == "continue") router.push({ name: "client.login" });
                        })
                        .catch(() => {});
                },
            };
        },
    });
</script>
