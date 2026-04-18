import { defineStore } from "pinia";
import { Model } from "./Model";
import { useTrips } from "./trips";
import { adjustTime, dateToTimeString } from "src/utilities/helpers";
import { date } from "quasar";
import { i18n } from "boot/i18n";
import { useBoatCategories } from "./boatCategories";
import { useRoutes } from "./routes";
import { useClients } from "./clients";
import { useTickets } from "./tickets";
import { usePasses } from "./passes";

const { t } = i18n.global;
export class SailingPlan extends Model {
    constructor({
        id,
        departure,
        planned_duration,
        arrival,
        status,
        guide_id,
        trip_id,
        boat_category_id,
        route_id,
        number_of_passengers,
        number_of_teens,
        number_of_children,
        boat_charge,
        note,
        boardings,
    } = {}) {
        super();
        this.id = id;
        this.departure = departure;
        this.planned_duration = planned_duration;
        this.arrival = arrival;
        this.status = status;
        this.guide_id = guide_id;
        this.trip_id = trip_id;
        this.boat_category_id = boat_category_id;
        this.route_id = route_id;
        this.number_of_passengers = number_of_passengers;
        this.number_of_teens = number_of_teens;
        this.number_of_children = number_of_children;
        this.boat_charge = boat_charge;
        this.note = note;
        this.boardings = boardings ? boardings.map((boarding) => new Boarding(boarding)) : [];
    }

    get trip() {
        return useTrips().find(this.trip_id);
    }
    get boatCategory() {
        return useBoatCategories().find(this.boat_category_id);
    }
    get route() {
        return useRoutes().find(this.route_id);
    }
    get title() {
        return this.trip.route.name + " (" + this.number_of_passengers + ")";
    }

    get displayName() {
        return (
            this.departure +
            " " +
            t("count_passengers", this.number_of_passengers) +
            " " +
            t("in") +
            " " +
            this.boatCategory.name +
            " " +
            t("to") +
            " " +
            this.route.name
        );
    }
    get departureDate() {
        return date.formatDate(this.departure, "DD MMMM YYYY");
    }
    get departure_time() {
        return dateToTimeString(this.departure);
    }
    get arrival_time() {
        return dateToTimeString(this.arrival ?? date.addToDate(this.departure, { minutes: this.planned_duration }));
    }
    set arrival_time(time) {
        this.arrival = adjustTime(
            this.arrival ?? date.addToDate(this.departure, { minutes: this.planned_duration }),
            time
        );
    }

    static PLANNED = 1;
    static ON_WATER = 2;
    static IS_BACK = 3;
    static statusOptions = [
        { label: t("planned"), value: SailingPlan.PLANNED },
        { label: t("on_water"), value: SailingPlan.ON_WATER },
        { label: t("is_back"), value: SailingPlan.IS_BACK },
    ];

    //for calendar component
    get time() {
        return this.departure_time;
    }
    get duration() {
        return date.getDateDiff(this.arrival, this.departure, "minutes");
    }
    get type() {
        return "SailingPlan";
    }
}

export class Boarding extends Model {
    constructor({ id, client_id, sailing_plan_id, boarding_item_id, boarding_item_type } = {}) {
        super();
        this.id = id;
        this.client_id = client_id;
        this.sailing_plan_id = sailing_plan_id;
        this.boarding_item_id = boarding_item_id;
        this.boarding_item_type = boarding_item_type;
    }

    get client() {
        return useClients().find(this.client_id);
    }
    get sailing_plan() {
        return useSailingPlans().find(this.sailing_plan_id);
    }
    get boarding_item() {
        if (this.boarding_item_type === "Ticket") {
            return useTickets().find(this.boarding_item_id);
        } else if (this.boarding_item_type === "Pass") {
            return usePasses().find(this.boarding_item_id);
        }
    }
    set boarding_item(boarding_item) {
        if (boarding_item === null) {
            this.boarding_item_type = null;
            this.boarding_item_id = null;
        } else {
            this.boarding_item_type = boarding_item.type;
            this.boarding_item_id = boarding_item.id;
        }
    }
}

export const useSailingPlans = defineStore({
    id: "sailingPlans",

    state() {
        return {
            url: "sailingPlans",
            className: "SailingPlan",
            class: SailingPlan,
        };
    },

    actions: {},
});
