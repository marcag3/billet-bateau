<template>
    <q-card class="splash-box no-margin no-border-radius">
        <q-card-section class="text-h6">
            {{ t("user_login_message") }}
        </q-card-section>
        <q-form class="col" @submit="onSubmit">
            <q-card-section class="q-gutter-lg">
                <!-- courriel -->
                <q-input
                    filled
                    v-model="user.email"
                    :label="t('email')"
                    type="email"
                    bottom-slots
                    @blur="touch('email')"
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

                <!-- password -->
                <q-input
                    filled
                    v-model="password"
                    :label="t('password')"
                    type="password"
                    bottom-slots
                    @blur="touch('password')"
                    :error="v$.password.$error"
                >
                    <template v-slot:before>
                        <q-icon name="fas fa-key" />
                    </template>
                    <template v-slot:error>
                        <template v-for="error of v$.password.$errors" :key="error.$uid">
                            <div v-html="error.$message" class="text-negative"></div>
                        </template>
                    </template>
                </q-input>

                <!-- name -->
                <div style="display: none">
                    <q-input filled v-model="name" :label="t('name')" no-error-icon> </q-input>
                </div>
            </q-card-section>
            <!-- buttons -->
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
                    :to="{ name: 'user.register' }"
                />
                <q-btn
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
    import { defineComponent, ref, computed } from "vue";
    import { useI18n } from "vue-i18n";
    import { useQuasar } from "quasar";
    import { useRouter } from "vue-router";
    import { useUser } from "../../store/user";
    import useVuelidate from "@vuelidate/core";
    import { useServerValidations } from "src/store/serverValidations";
    import { required, email } from "src/utilities/validators";
    import { useAppState } from "src/store/appState";

    export default defineComponent({
        name: "login",
        setup() {
            const { t } = useI18n();
            const $q = useQuasar();
            const password = ref();
            const user = useUser();
            const name = ref("");
            const router = useRouter();
            const appState = useAppState();

            if (appState.isDev) {
                user.email = "admin@example.com";
                password.value = "password";
            }
            const validations = useServerValidations();
            const rules = {
                email: { required, email },
                password: { required },
            };

            const v$ = useVuelidate(
                rules,
                computed(() => ({ email: user.email, password })),
                {
                    $externalResults: computed(() => validations.errors),
                    $lazy: true,
                }
            );

            return {
                t,
                password,
                name,
                user,
                v$,

                touch(field) {
                    v$.value[field].$touch();
                    delete validations.errors[field];
                },
                onSubmit() {
                    v$.value.$touch();
                    if (v$.value.$error) return;
                    user.login(password.value, name.value)
                        .then(() => {
                            $q.notify({
                                color: "positive",
                                icon: "cloud_done",
                                message: t("authenticated"),
                            });
                            router.push(appState.requestedRoute ?? { name: "user.dashboard" });
                        })
                        .catch();
                },
            };
        },
    });
</script>
