<template>
    <q-card class="splash-box no-margin no-border-radius">
        <q-card-section class="text-h6">
            {{ t("email_sent", { email: clients.current.email }) }}
        </q-card-section>
        <q-form class="col" @submit="onSubmit">
            <q-card-section>
                <q-input
                    filled
                    v-model="passphrase"
                    :label="t('enter_passphrase')"
                    type="text"
                    no-error-icon
                    :error="v$.passphrase.$error"
                    @blur="touch('passphrase')"
                    bottom-slots
                >
                    <template v-slot:before>
                        <q-icon name="fas fa-user-secret" />
                    </template>
                    <template v-slot:error>
                        <template v-for="error of v$.passphrase.$errors" :key="error.$uid">
                            <div v-html="error.$message" class="text-negative"></div>
                        </template>
                    </template>
                </q-input>
                <div style="display: none">
                    <q-input filled v-model="name" :label="t('name')" no-error-icon> </q-input>
                </div>
            </q-card-section>

            <q-card-actions>
                <q-btn
                    :ripple="{ center: true }"
                    color="primary"
                    unelevated
                    class="no-border-radius full-width"
                    icon="fas fa-key"
                    :label="t('continue')"
                    type="submit"
                />
            </q-card-actions>
        </q-form>
    </q-card>
</template>

<script>
    import { defineComponent, ref, onMounted, computed } from "vue";
    import { useI18n } from "vue-i18n";
    import { useQuasar } from "quasar";
    import { useRouter } from "vue-router";
    import { useClients } from "../../store/clients";
    import { useServerValidations } from "src/store/serverValidations";
    import { required } from "../../utilities/validators";
    import useVuelidate from "@vuelidate/core";
    import { useAppState } from "src/store/appState";

    export default defineComponent({
        name: "client-login",
        setup() {
            const $q = useQuasar();
            const clients = useClients();
            const name = ref("");
            const passphrase = ref();
            const { t } = useI18n();
            const router = useRouter();
            const validations = useServerValidations();
            const appState = useAppState();
            const rules = {
                passphrase: { required },
            };

            const v$ = useVuelidate(
                rules,
                { passphrase },
                { $externalResults: computed(() => validations.errors), $lazy: true }
            );

            onMounted(() => {
                if ("url" in router.currentRoute.value.query) {
                    clients
                        .loginLink(router.currentRoute.value.query)
                        .then(() => {
                            $q.notify({
                                color: "positive",
                                icon: "cloud_done",
                                message: t("authenticated"),
                            });
                            router.push(appState.requestedRoute ?? { name: "client.home" });
                        })
                        .catch((e) => {
                            if (e.response && e.response.data.errors)
                                Object.keys(e.response.data.errors).forEach((key) => {
                                    $q.notify({
                                        color: "negative",
                                        icon: "error",
                                        html: true,
                                        message: e.response.data.errors[key].join(", "),
                                    });
                                });
                            router.push({ name: "client.welcome" });
                        });
                } else if (!clients.current.email) router.push({ name: "client.welcome" });
            });

            return {
                t,
                name,
                passphrase,
                clients,
                v$,
                validations,
                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },

                onSubmit() {
                    v$.value.$touch();
                    if (v$.value.$error) return;
                    clients.login(passphrase.value, name.value).then(() => {
                        $q.notify({
                            color: "positive",
                            icon: "cloud_done",
                            message: t("authenticated"),
                        });
                        router.push(appState.requestedRoute ?? { name: "client.home" });
                    });
                },
            };
        },
    });
</script>
