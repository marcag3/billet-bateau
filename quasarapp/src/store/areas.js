import { defineStore } from "pinia";
import { Model } from "./Model";

export class Area extends Model {
    constructor({ id, name, address, apartment, city, postalCode, telephone, email } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.address = address;
        this.apartment = apartment;
        this.city = city;
        this.postalCode = postalCode;
        this.telephone = telephone;
        this.email = email;
    }
}

export const useAreas = defineStore({
    id: "areas",

    state() {
        return {
            url: "areas",
            className: "Area",
            class: Area,
        };
    },
});
