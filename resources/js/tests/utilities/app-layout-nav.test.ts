import { defineComponent, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import {
    provideAppProgramMainNavTarget,
    useAppProgramMainNavTeleport,
} from "../../utilities/app-layout-nav";

const Consumer = defineComponent({
    setup() {
        return useAppProgramMainNavTeleport();
    },
    render() {
        return h("div", {
            "data-disabled": String(this.teleportDisabled),
            "data-key": this.teleportTargetKey,
            "data-has-target": String(this.teleportTo != null),
        });
    },
});

describe("useAppProgramMainNavTeleport", () => {
    it("disables teleport until the layout provides a mount element", async () => {
        const target = ref<HTMLElement | null>(null);

        const Provider = defineComponent({
            setup() {
                provideAppProgramMainNavTarget(target);
                return () => h(Consumer);
            },
        });

        const wrapper = mount(Provider);
        expect(wrapper.get("[data-disabled]").attributes("data-disabled")).toBe(
            "true",
        );
        expect(wrapper.get("[data-key]").attributes("data-key")).toBe("pending");

        target.value = document.createElement("div");
        await nextTick();

        expect(wrapper.get("[data-disabled]").attributes("data-disabled")).toBe(
            "false",
        );
        expect(wrapper.get("[data-has-target]").attributes("data-has-target")).toBe(
            "true",
        );
        expect(wrapper.get("[data-key]").attributes("data-key")).toBe("ready");
    });

    it("stays disabled when no provider is registered", () => {
        const wrapper = mount(Consumer);
        expect(wrapper.get("[data-disabled]").attributes("data-disabled")).toBe(
            "true",
        );
    });
});
