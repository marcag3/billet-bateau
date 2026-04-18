import { defineStore } from "pinia";
import { i18n } from "src/boot/i18n";
import { useActivities } from "./activities";
import { Model } from "./Model";

const { locale } = i18n.global;
export class BoatCategory extends Model {
    constructor({
        id,
        name,
        total_capacity,
        teen_capacity,
        child_capacity,
        minimum_booking_person,
        description_fr,
        description_en,
        imageURL,
        activity_id,
    } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.total_capacity = total_capacity;
        this.teen_capacity = teen_capacity;
        this.child_capacity = child_capacity;
        this.minimum_booking_person = minimum_booking_person;
        this.description_fr = description_fr;
        this.description_en = description_en;
        this.imageURL = imageURL;
        this.activity_id = activity_id ?? null;
    }

    get description() {
        return locale === "en-US" ? this.description_en : this.description_fr;
    }

    get image() {
        return this.imageFile ? URL.createObjectURL(this.imageFile) : this.imageURL;
    }

    get activity() {
        return useActivities().find(this.activity_id);
    }

    formatToSend() {
        let formData = new FormData();
        Object.keys(this).forEach((key) => {
            if (this[key] != null) formData.append(key, this[key]);
        });
        this.imageFile ? formData.set("image", this.imageFile) : formData.delete("image");
        formData.delete("imageFile");

        return formData;
    }
}

export const useBoatCategories = defineStore({
    id: "boatCategories",

    state() {
        return {
            url: "boat-categories",
            className: "BoatCategory",
            class: BoatCategory,
        };
    },
});
