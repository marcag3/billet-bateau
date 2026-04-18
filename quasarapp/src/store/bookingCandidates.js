import { defineStore } from "pinia";
import { i18n } from "boot/i18n";
import { Model } from "./Model";
import { useTrips } from "./trips";
import { useBookings } from "./bookings";

const { t } = i18n.global;

export class BookingCandidate extends Model {
    constructor({
        trip_id,
        total_availability,
        teen_availability,
        child_availability,
        boat_availability,
        guided,
        for_date,
        total_capacity,
        is_only_full_boat,
    } = {}) {
        super();
        this.trip_id = trip_id;
        this.total_availability = total_availability;
        this.teen_availability = teen_availability;
        this.child_availability = child_availability;
        this.boat_availability = boat_availability;
        this.guided = guided;
        this.for_date = for_date;
        this.total_capacity = total_capacity;
        this.is_only_full_boat = is_only_full_boat;
    }
    get trip() {
        return useTrips().find(this.trip_id);
    }
    get id() {
        return this.trip_id;
    }
    get title() {
        return this.trip.route.name + " (" + this.number_of_passengers + "/" + this.total_capacity + ") ";
    }
    get displayName() {
        return (
            t("booking_candidate") +
            " - " +
            t("trip") +
            ": " +
            this.trip_id +
            " - " +
            t("available_places", this.total_availability)
        );
    }
    get status() {
        return this.total_availability < this.trip.boatCategory.total_capacity ? 1 : 0;
    }
    get number_of_passengers() {
        return useBookings().list.reduce((sum, booking) => (sum += booking.number_of_passengers), 0);
    }
    get time() {
        return this.trip.start_time;
    }
    get duration() {
        return this.trip.route.duration;
    }
    get boat_category_id() {
        return this.trip.boatCategory.id;
    }
    get bookings() {
        return useBookings().list.filter(({ trip_id }) => trip_id === this.trip_id);
    }

    guidedMap = {
        1: "guide_mandatory",
        2: "guide_optional",
        3: "guide_not_available",
    };

    get displayIsGuided() {
        return this.guidedMap[this.guided];
    }
    get type() {
        return "BookingCandidate";
    }
}

export const useBookingCandidates = defineStore({
    id: "bookingCandidates",

    state() {
        return {
            url: "booking-candidates",
            className: "BookingCandidate",
            class: BookingCandidate,
        };
    },

    actions: {},
});
