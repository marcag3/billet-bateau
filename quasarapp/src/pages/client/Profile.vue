<template>
    <ClientForm @completed="formFilled" />
</template>

<script>
    import { defineComponent, ref } from "vue";
    import ClientForm from "components/ClientForm";
    import { useRouter } from "vue-router";

    import { useAppState } from "src/store/appState";

    export default defineComponent({
        name: "clientProfile",
        components: {
            ClientForm,
        },
        setup() {
            const appState = useAppState();
            const router = useRouter();

            return {
                formFilled() {
                    appState.filledForm = true;

                    router.push(appState.nextStep("profil"));
                },
            };
        },
    });
</script>
