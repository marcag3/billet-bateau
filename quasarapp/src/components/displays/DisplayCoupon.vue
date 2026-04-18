<template>
    <q-card class="q-mb-sm q-pa-sm row">
        <div class="col-grow">
            <span class="text-subtitle1">
                {{ coupon.promotion.name }}
                <br />
            </span>
            {{ coupon.promotion.displayValue }} <br />
        </div>
    </q-card>
</template>

<script>
    import { useI18n } from "vue-i18n";
    import { Coupon } from "src/store/coupons";
    export default {
        // name: 'ComponentName',
        props: {
            coupon: Coupon,
        },
        setup() {
            const { t } = useI18n();
            return {
                t,
            };
        },
    };
</script>
