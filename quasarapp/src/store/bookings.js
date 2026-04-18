import { defineStore } from "pinia";
import { i18n } from "boot/i18n";
import { Model } from "./Model";
import { useTrips } from "./trips";
import { useClients } from "./clients";
import { useUsers } from "./users";
import { dateToDateString } from "src/utilities/helpers";

const { t } = i18n.global;

export class Booking extends Model {
    constructor({
        id,
        client_id,
        user_id,
        for_date,
        trip_id,
        number_of_adults,
        number_of_teens,
        number_of_children,
        number_of_boats,
        is_guided,
        confirmed_at,
        note,
        is_full_boat,
        possible_products,
        possible_subscriptions,
    } = {}) {
        super();
        this.id = id;
        this.client_id = client_id;
        this.user_id = user_id;
        this.for_date = for_date;
        this.trip_id = trip_id;
        this.number_of_adults = number_of_adults;
        this.number_of_teens = number_of_teens;
        this.number_of_children = number_of_children;
        this.is_guided = is_guided;
        this.confirmed_at = confirmed_at;
        this.note = note;
        this.is_full_boat = is_full_boat;
        this.number_of_boats = number_of_boats;
        this.possible_products = possible_products;
        this.possible_subscriptions = possible_subscriptions;
    }

    get trip() {
        return useTrips().find(this.trip_id);
    }
    get title() {
        return (
            t("adults", this.number_of_adults) +
            ", " +
            t("teens", this.number_of_teens) +
            ", " +
            t("children", this.number_of_children)
        );
    }
    get displayIsGuided() {
        return this.is_guided ? t("with_guide") : t("rental");
    }
    get user() {
        return useUsers().find(this.user_id);
    }
    get number_of_passengers() {
        return this.number_of_adults + this.number_of_teens + this.number_of_children;
    }
    get displayDate() {
        return dateToDateString(this.for_date);
    }
    get client() {
        return useClients().find(this.client_id);
    }
}

export const useBookings = defineStore({
    id: "bookings",

    state() {
        return {
            url: "bookings",
            clientUrl: "clients/" + useClients().current.id + "/bookings",
            className: "Booking",
            class: Booking,
        };
    },
    actions: {
        async updateRelated(booking) {
            return useClients().show(booking.client);
        },
    },
});
