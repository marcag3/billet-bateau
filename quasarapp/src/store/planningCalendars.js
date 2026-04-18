import { defineStore } from "pinia";
import { Model } from "./Model";

export class PlanningCalendar extends Model {
    constructor({
        id,
        name,
        monday,
        tuesday,
        wednesday,
        thursday,
        friday,
        saturday,
        sunday,
        start_date,
        end_date,
    } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.monday = monday ?? true;
        this.tuesday = tuesday ?? true;
        this.wednesday = wednesday ?? true;
        this.thursday = thursday ?? true;
        this.friday = friday ?? true;
        this.saturday = saturday ?? true;
        this.sunday = sunday ?? true;
        this.start_date = start_date;
        this.end_date = end_date;
    }
    get days() {
        return {
            monday: this.monday,
            tuesday: this.tuesday,
            wednesday: this.wednesday,
            thursday: this.thursday,
            friday: this.friday,
            saturday: this.saturday,
            sunday: this.sunday,
        };
    }
}

export const usePlanningCalendars = defineStore({
    id: "PlanningCalendars",

    state() {
        return {
            url: "calendars",
            className: "PlanningCalendar",
            class: PlanningCalendar,
        };
    },
});
