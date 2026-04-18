<template>
    <q-layout view="hHh LpR fFf">
        <q-header elevated class="bg-primary text-white" height-hint="98">
            <q-toolbar>
                <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

                <q-toolbar-title v-if="guard == 'client'" class="cursor-pointer">
                    <q-avatar>
                        <img src="/logo.png" />
                    </q-avatar>
                    {{ t("member_space") }}
                </q-toolbar-title>

                <q-toolbar-title v-if="guard == 'user'" class="cursor-pointer">
                    <q-avatar>
                        <img src="/logo.png" />
                    </q-avatar>
                    {{ t("jedi_space") }}
                </q-toolbar-title>

                <ChoosePointOfSale v-if="$q.screen.gt.xs" top />
                <LanguageSelector class="q-mx-sm" v-if="$q.screen.gt.xs" />

                <!-- profile -->
                <q-btn-dropdown icon="fas fa-user-alt" :label="appState.authName" flat stretch no-caps class="gt-xs">
                    <q-list>
                        <q-item clickable v-close-popup :to="{ name: 'client.profile' }">
                            <q-item-section>
                                <q-item-label>{{ t("profile") }}</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="logout">
                            <q-item-section>
                                <q-item-label>{{ t("logout") }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>

                <!-- Cart -->
                <template
                    v-if="
                        router.currentRoute.value.name === 'user.store' ||
                        (!!invoices.current.id && invoices.current.invoice_items.length > 0)
                    "
                >
                    <q-btn
                        v-if="
                            router.currentRoute.value.name === 'client.store' ||
                            router.currentRoute.value.name === 'user.store'
                        "
                        flat
                        stretch
                        class="q-mx-sm"
                        @click="appState.rightDrawerOpen = !appState.rightDrawerOpen"
                    >
                        <q-icon name="fas fa-shopping-cart">
                            <q-badge
                                v-if="!!invoices.current.invoice_items"
                                color="positive"
                                :label="invoices.current.totalNumberOfItems"
                            />
                        </q-icon>
                    </q-btn>
                    <q-btn
                        v-else-if="appState.guard === 'client'"
                        flat
                        stretch
                        class="q-mx-sm"
                        :to="{ name: 'client.store' }"
                    >
                        <q-icon name="fas fa-shopping-cart">
                            <q-badge
                                v-if="!!invoices.current.invoice_items"
                                color="positive"
                                :label="invoices.current.totalNumberOfItems"
                            />
                        </q-icon>
                    </q-btn>
                </template>
            </q-toolbar>
        </q-header>

        <q-drawer show-if-above v-model="leftDrawerOpen" side="left" elevated :width="250">
            <q-list dense class="q-mr-lg q-mt-lg">
                <q-expansion-item
                    icon="fas fa-user-alt"
                    :label="appState.authName"
                    class="xs"
                    :content-inset-level="1"
                    no-caps
                >
                    <q-list>
                        <q-item clickable v-close-popup :to="{ name: 'client.profile' }">
                            <q-item-section>
                                <q-item-label>{{ t("profile") }}</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="logout">
                            <q-item-section>
                                <q-item-label>{{ t("logout") }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-expansion-item>
                <q-separator spaced class="xs" />

                <template v-for="(category, index) in routes" :key="index">
                    <q-item
                        v-for="route in category"
                        :key="route.path"
                        clickable
                        :to="route.path"
                        exact
                        v-ripple
                        exact-active-class="bg-secondary text-dark"
                        class="rounded-borders"
                    >
                        <q-item-section avatar>
                            <q-icon :name="route.meta.icon" />
                        </q-item-section>
                        <q-item-section>
                            {{ t(route.name.split(".")[1]) }}
                        </q-item-section>
                    </q-item>
                    <q-separator spaced />
                </template>

                <template v-if="guard == 'user'">
                    <q-item-label header> V2 </q-item-label>
                    <q-item
                        v-for="route in v2routes"
                        :key="route.path"
                        clickable
                        :href="baseURL + '/' + route.path"
                        class="rounded-borders"
                        tag="a"
                    >
                        <q-item-section v-if="route.icon" avatar>
                            <q-icon :name="route.icon" />
                        </q-item-section>
                        <q-item-section>
                            {{ route.name }}
                        </q-item-section>
                    </q-item>
                    <q-separator spaced class="xs" />
                </template>

                <ChoosePointOfSale class="q-my-sm" v-if="$q.screen.xs" />
                <LanguageSelector class="q-my-sm" v-if="$q.screen.xs" />
            </q-list>
        </q-drawer>

        <q-page-container>
            <MinimumInfoBanner
                v-if="guard == 'client' && !clients.current.is_profile_complete && bookings.list.length > 0"
            />
            <q-page :padding="$q.screen.lt.sm || appState.noPagePadding ? false : true">
                <router-view />
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script>
    import { ref, onMounted } from "vue";
    import { useI18n } from "vue-i18n";
    import { useRouter } from "vue-router";
    import { useAppState } from "src/store/appState";
    import LanguageSelector from "components/LanguageSelector";
    import { useQuasar } from "quasar";
    import MinimumInfoBanner from "components/MinimumInfoBanner";
    import { useClients } from "src/store/clients";
    import { useBookings } from "src/store/bookings";
    import { useInvoices } from "src/store/invoices";
    import ChoosePointOfSale from "src/components/ChoosePointOfSale.vue";

    export default {
        name: "MainLayout",
        components: {
            LanguageSelector,
            MinimumInfoBanner,
            ChoosePointOfSale,
        },

        setup() {
            const leftDrawerOpen = ref(false);
            const { t } = useI18n();
            const router = useRouter();
            const $q = useQuasar();
            const clients = useClients();
            const bookings = useBookings();
            const invoices = useInvoices();
            const appState = useAppState();
            const baseURL = ref(appState.baseURL);

            const guard = appState.guard;
            let routes = router
                .getRoutes()
                .filter((route) => route.name)
                .filter((route) => route.meta.auth === guard)
                .reduce((group, route) => {
                    const { category } = route.meta;
                    group[category] = group[category] ?? [];
                    group[category].push(route);
                    return group;
                }, {});

            if (appState.isDev) {
                $q.notify({
                    closeBtn: true,
                    color: "warning",
                    textColor: "black",
                    icon: "warning",
                    message: "Application en test, les données sont fictives et seront écrasées régulièrement",
                });
            }
            appState.$subscribe((mutation, state) => {
                localStorage.setItem("lastBookingId", JSON.stringify(state.lastBookingId));
                localStorage.setItem("filledForm", JSON.stringify(state.filledForm));
                localStorage.setItem("paymentCreated", JSON.stringify(state.paymentCreated));
            });
            onMounted(async () => {
                invoices.showCurrent(clients.current.active_invoice_id);
            });

            return {
                t,
                appState,
                guard,
                leftDrawerOpen,
                routes,
                baseURL,
                clients,
                router,
                bookings,
                invoices,
                v2routes: [
                    {
                        name: "Jedis",
                        path: "users",
                        icon: "fas fa-jedi",
                    },
                    {
                        name: "Roles",
                        path: "roles",
                        icon: "fas fa-journal-whills",
                    },
                ],
                toggleLeftDrawer() {
                    leftDrawerOpen.value = !leftDrawerOpen.value;
                },
                logout() {
                    appState.logout();
                },
            };
        },
    };
</script>
