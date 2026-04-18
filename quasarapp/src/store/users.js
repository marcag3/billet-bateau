import { defineStore } from "pinia";
import { Model } from "./Model";

export class User extends Model {
    constructor({ id, name, email } = {}) {
        super();
        this.id = id;
        this.name = name;
        this.email = email;
    }
}

export const useUsers = defineStore({
    id: "users",

    state() {
        return {
            url: "users",
            className: "User",
            class: User,
        };
    },

    actions: {},
});
