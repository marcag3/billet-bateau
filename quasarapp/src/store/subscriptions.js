import dayjs from "dayjs";
import { defineStore } from "pinia";
import { date } from "quasar";
import { i18n } from "src/boot/i18n";
import { dateToDateString } from "src/utilities/helpers";
import { useConfigs } from "./configs";
import { Model } from "./Model";
import { usePointsOfSale } from "./pointsOfSale";
import { usePromotions } from "./promotions";

const { t } = i18n.global;
export class Subscription extends Model {
    constructor({
        id,
        name,
        price,
        duration,
        add_promotion_id,
        is_taxable,
        permits_boarding,
        boat_categories_id,
        is_rental,
        max_passenger,
        available_points_of_sale_ids,
        is_full_boat,
        fiscal_year_expiry,
        expiration_date,
    } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.price = price;
        this.duration = duration;
        this.add_promotion_id = add_promotion_id;
        this.is_taxable = is_taxable;
        this.permits_boarding = permits_boarding;
        this.boat_categories_id = boat_categories_id;
        this.is_rental = is_rental;
        this.max_passenger = max_passenger;
        this.available_points_of_sale_ids = available_points_of_sale_ids ?? [];
        this.is_full_boat = is_full_boat;
        this.fiscal_year_expiry = fiscal_year_expiry;
        this.expiration_date = expiration_date;
    }

    get displayDuration() {
        return this.fiscal_year_expiry ? t("fiscal_year_expiry") : this.formatDuration("duration", "days");
    }

    get addPromotion() {
        return usePromotions().find(this.add_promotion_id);
    }
    get displayPermitsBoarding() {
        return this.permits_boarding ? t("boarding_allowed") : t("boarding_restricted");
    }
    get pointsOfSale() {
        if (this.available_points_of_sale_ids.length == 0) return [];
        return usePointsOfSale().list.filter((pos) => this.available_points_of_sale_ids.includes(pos.id));
    }

    get displayAvailable() {
        return this.pointsOfSale.map((pos) => pos.name).join(", ");
    }

    get defaultExpiryDate() {
        return dateToDateString(date.addToDate(new Date(), { days: this.duration }));
    }

    //for store
    get type() {
        return "App\\Subscription";
    }
}

export const useSubscriptions = defineStore({
    id: "subscriptions",

    state() {
        return {
            url: "subscriptions",
            className: "Subscription",
            class: Subscription,
        };
    },
});
