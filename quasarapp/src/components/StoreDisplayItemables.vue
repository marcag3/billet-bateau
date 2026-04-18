<template>
    <div v-for="(storeCategory, index) in storeCategories" :key="index">
        <q-intersection :style="{ 'min-height': displayImages ? '420px' : null }">
            <q-parallax v-if="displayImages" :height="400" class="q-my-md bg-grey" :src="storeCategory.image">
                <h3 class="text-white">{{ storeCategory.name }}</h3>
            </q-parallax>
            <h3 class="text-h5" v-else>
                <q-icon :name="storeCategory.icon" />
                {{ storeCategory.name }}
            </h3>
        </q-intersection>
        <div class="row q-col-gutter-lg">
            <q-intersection
                style="min-height: 310px"
                class="col-6 col-sm-4 col-lg-3"
                v-for="item in storeCategory.items"
                :key="item.id"
            >
                <component
                    :is="storeCategory.component"
                    :item="item"
                    @add="addInvoiceItem(item)"
                    @remove="removeInvoiceItem(item)"
                />
            </q-intersection>
        </div>
    </div>
</template>

<script>
    import { computed, ref, onMounted, toRefs } from "vue";
    import { useI18n } from "vue-i18n";
    import StoreDisplayProduct from "src/components/StoreDisplayProduct.vue";
    import StoreDisplaySubscription from "src/components/StoreDisplaySubscription.vue";
    import StoreDisplayPromotion from "src/components/StoreDisplayPromotion.vue";
    import { useBoatCategories } from "src/store/boatCategories";
    import { Invoice } from "src/store/invoices";
    import config from "src/config.json";
    import { useClients, Client } from "src/store/clients";
    import useProductsList from "src/composables/useProductsList";
    import useSubscriptionsList from "src/composables/useSubscriptionsList";
    import usePromotionsList from "src/composables/usePromotionsList";

    export default {
        // name: 'ComponentName',
        props: {
            displayPromotions: Boolean,
            displayImages: Boolean,
            client: Client,
            invoice: Invoice,
        },
        components: {
            StoreDisplayProduct,
            StoreDisplaySubscription,
            StoreDisplayPromotion,
        },
        emits: ["addInvoiceItem", "removeInvoiceItem"],
        setup(props, { emit }) {
            const { t } = useI18n();
            const boatCategories = useBoatCategories();
            const isLoading = ref(true);
            const clients = useClients();
            const { client, invoice } = toRefs(props);
            const { productsList } = useProductsList(client, invoice);
            const { subscriptionsList } = useSubscriptionsList();
            const { promotionsList } = usePromotionsList(client, invoice);

            onMounted(() => {
                Promise.all([boatCategories.getIndexDebounce()]).then(() => {
                    isLoading.value = false;
                });
            });

            const storeCategories = computed(() => {
                let storeCategories = productsList.value.reduce((groupedObject, product) => {
                    if (!groupedObject[product.boat_category_id]) {
                        groupedObject[product.boat_category_id] = {
                            name: product.boatCategory.displayName,
                            icon: config.icons["product"],
                            image: product.boatCategory.imageURL ?? "/boat-1014711_960_720.jpg",
                            component: "StoreDisplayProduct",
                            items: [],
                        };
                    }
                    if (props.invoice.invoice_items) {
                        let itemInInvoice = props.invoice.invoice_items.find(
                            (invoiceItem) =>
                                product.id === invoiceItem.itemable_id && invoiceItem.itemable_type === "App\\Product"
                        );
                        product.numberInCart = itemInInvoice === undefined ? undefined : itemInInvoice.number_of_items;
                    }
                    groupedObject[product.boat_category_id].items.push(product);
                    return groupedObject;
                }, {});

                if (subscriptionsList.value.length > 0) {
                    storeCategories["subscriptions"] = {
                        icon: config.icons["subscription"],
                        name: t("subscriptions"),
                        image: "/proue_fantail.jpg",
                        component: "StoreDisplaySubscription",
                        items: subscriptionsList.value.map((subscription) => {
                            if (props.invoice.invoice_items) {
                                let itemInInvoice = props.invoice.invoice_items.find(
                                    (invoiceItem) =>
                                        subscription.id === invoiceItem.itemable_id &&
                                        invoiceItem.itemable_type === "App\\Subscription"
                                );
                                subscription.numberInCart =
                                    itemInInvoice === undefined ? undefined : itemInInvoice.number_of_items;
                                return subscription;
                            }
                            return {};
                        }),
                    };
                }
                if (promotionsList.value.length > 0 && props.displayPromotions) {
                    storeCategories["promotions"] = {
                        name: t("promotions"),
                        icon: config.icons["promotion"],
                        image: "/trees-5974614_960_720.jpg",
                        component: "StoreDisplayPromotion",
                        items: promotionsList.value.map((promotion) => {
                            let itemInInvoice = props.invoice.invoice_items.find(
                                (invoiceItem) =>
                                    promotion.id === invoiceItem.itemable_id &&
                                    invoiceItem.itemable_type === "App\\Promotion"
                            );
                            promotion.numberInCart =
                                itemInInvoice === undefined ? undefined : itemInInvoice.number_of_items;
                            return promotion;
                        }),
                    };
                }
                return storeCategories;
            });

            return {
                t,
                clients,
                storeCategories,
                productsList,
                subscriptionsList,
                promotionsList,
                isLoading,
                addInvoiceItem(itemable) {
                    emit("addInvoiceItem", itemable);
                },

                removeInvoiceItem(itemable) {
                    emit("removeInvoiceItem", itemable);
                },
            };
        },
    };
</script>
