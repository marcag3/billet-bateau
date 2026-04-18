<template>
    <div class="fullscreen bg-blue text-white text-center q-pa-md flex flex-center">
        <div>
            <div style="font-size: 30vh">404</div>

            <div class="text-h2" style="opacity: 0.4">Oops. Nothing here...</div>
            <q-btn
                class="q-mt-xl"
                color="white"
                text-color="blue"
                unelevated
                :to="'/' + route.fullPath.split('/')[1]"
                label="Go Home"
                no-caps
            />
        </div>
    </div>
</template>

<script>
    import { defineComponent } from "vue";
    import { useRoute } from "vue-router";
    import { onMounted } from "vue";
    import { useAppState } from "../store/appState";

    export default defineComponent({
        name: "Error404",

        setup() {
            const route = useRoute();
            const appState = useAppState();
            const guard = appState.authGuard;

            onMounted(() => {
                // window.location = "http://localhost" + route.fullPath;
            });

            return {
                guard,
                route,
            };
        },
    });
</script>
