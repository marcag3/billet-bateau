import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { mount } from "@vue/test-utils";
import { Quasar } from "quasar";
import lang from "quasar/lang/en-US";

import AppBootstrapGate from "../../components/ui/AppBootstrapGate.vue";

describe("AppBootstrapGate", () => {
    it("accepts a ref as errorMessage without throwing", () => {
        const errorMessage = ref("Sync failed");

        expect(() =>
            mount(AppBootstrapGate, {
                props: {
                    ready: false,
                    errorMessage,
                },
                global: {
                    plugins: [[Quasar, { lang }]],
                },
            }),
        ).not.toThrow();
    });

    it("shows the resolved error message", () => {
        const wrapper = mount(AppBootstrapGate, {
            props: {
                ready: false,
                errorMessage: "Sync failed",
            },
            global: {
                plugins: [[Quasar, { lang }]],
            },
        });

        expect(wrapper.text()).toContain("Sync failed");
    });
});
