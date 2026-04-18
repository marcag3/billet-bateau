<template>
    <q-layout view="hHh lpR fFf" class="full-image-background">
        <q-page-container>
            <q-page padding class="row justify-center items-center">
                <div>
                    <q-card class="splash-box transparent no-margin no-border-radius">
                        <q-card-section class="no-padding">
                            <q-img src="/logo+texte-petit.png" :img-style="{ opacity: 0.85 }" cover> </q-img>
                        </q-card-section>
                    </q-card>
                    <router-view />
                </div>
            </q-page>
        </q-page-container>
        <div class="fixed-top">
            <LanguageSelector />
        </div>
    </q-layout>
</template>

<script>
    import LanguageSelector from "components/LanguageSelector";

    export default {
        name: "Welcome",
        components: {
            LanguageSelector,
        },

        setup() {
            return {};
        },
    };
</script>
