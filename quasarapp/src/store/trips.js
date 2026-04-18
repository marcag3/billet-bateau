import { defineStore } from "pinia";
import { timeToDate, dateToTimeString } from "../utilities/helpers";
import { date } from "quasar";
import { useRoutes } from "./routes";
import { Model } from "./Model";
import { i18n } from "boot/i18n";
import { usePlanningCalendars } from "./planningCalendars";
import { useBoatInventories } from "./boatInventories";
import { useBoatCategories } from "./boatCategories";

const { t } = i18n.global;
export class Trip extends Model {
    constructor({ id, route_id, service_id, boat_category_id, start_time, guided, boat_inventory_id } = {}) {
        super();
        this.id = id;
        this.route_id = route_id;
        this.service_id = service_id;
        this.boat_category_id = boat_category_id;
        this.guided = guided;
        this.boat_inventory_id = boat_inventory_id;
        this.start_time = start_time;
    }

    get route() {
        return useRoutes().find(this.route_id);
    }

    get service() {
        return usePlanningCalendars().find(this.service_id);
    }

    get boatCategory() {
        return useBoatCategories().find(this.boat_category_id);
    }

    get boatInventory() {
        return useBoatInventories().find(this.boat_inventory_id);
    }

    static MANDATORY = 1;
    static OPTIONAL = 2;
    static NOT_AVAILABLE = 3;

    static guidedOptions = [
        {
            label: t("guide_mandatory"),
            value: Trip.MANDATORY,
        },
        { label: t("guide_optional"), value: Trip.OPTIONAL },
        { label: t("guide_not_available"), value: Trip.NOT_AVAILABLE },
    ];

    get duration() {
        return this.route.duration;
    }

    get end_time() {
        let duration = this.duration;
        let endTime = date.addToDate(timeToDate(this.start_time), { minutes: duration });
        return dateToTimeString(endTime);
    }

    get displayName() {
        return (
            this.route.name +
            " " +
            this.start_time +
            " " +
            t("to") +
            " " +
            this.end_time +
            " (" +
            this.formatDuration("duration", "minutes") +
            ") " +
            this.boatCategory.displayName +
            ", " +
            this.formatOption("guided")
        );
    }
}

export const useTrips = defineStore({
    id: "trips",

    state() {
        return {
            url: "trips",
            className: "Trip",
            class: Trip,
        };
    },

    actions: {},
});
