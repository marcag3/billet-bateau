import { defineStore } from "pinia";
import { useAreas } from "./areas";
import { Model } from "./Model";
import { useStops } from "./stops";

export class Route extends Model {
    constructor({ id, name, duration, route_stops, area_id } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.duration = duration;
        this.area_id = area_id;
        this.route_stops = route_stops ? route_stops.map((route_stop) => new RouteStop(route_stop)) : [];
    }

    get firstRouteStop() {
        return this.route_stops[0];
    }
    get displayName() {
        return this.id ? this.name + " (" + this.formatDuration("duration", "minutes") + ") " : "";
    }

    get area() {
        return useAreas().find(this.area_id);
    }
}

export class RouteStop extends Model {
    constructor({ id, stop_id, stop_sequence, arrival_minutes }) {
        super();
        this.id = id;
        this.stop_id = stop_id;
        this.stop_sequence = stop_sequence;
        this.arrival_minutes = arrival_minutes;
    }

    get stop() {
        return useStops().find(this.stop_id);
    }
}

export const useRoutes = defineStore({
    id: "routes",

    state() {
        return {
            url: "routes",
            className: "Route",
            class: Route,
        };
    },
});
